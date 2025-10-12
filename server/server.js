const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store active collaboration sessions
const collaborationSessions = new Map();

// Store authenticated Scratch users
const scratchUsers = new Map();

// Store friends data (in production, this would be a database)
const friendsData = new Map(); // username -> friends list
const friendRequests = new Map(); // username -> pending requests
const notificationsData = new Map(); // username -> notifications list

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  console.log('New WebSocket connection established');

  // Generate unique client ID
  const clientId = uuidv4();
  ws.clientId = clientId;

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    handleClientDisconnect(ws);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    timestamp: Date.now()
  }));
});

// Handle WebSocket messages
function handleWebSocketMessage(ws, data) {
  const { type, projectId, userName, clientId, scratchAuth } = data;

  switch (type) {
    case 'join':
      handleJoinProject(ws, data);
      break;

    case 'authenticate':
      handleUserAuthentication(ws, data);
      break;

    case 'leave':
      handleLeaveProject(ws, data);
      break;

    case 'projectUpdate':
      handleProjectUpdate(ws, data);
      break;

    case 'cursorMove':
      handleCursorMove(ws, data);
      break;

    case 'chatMessage':
      handleChatMessage(ws, data);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'friendInvitation':
      handleFriendInvitation(ws, data);
      break;

    case 'addFriend':
      handleAddFriend(ws, data);
      break;

    case 'removeFriend':
      handleRemoveFriend(ws, data);
      break;

    case 'getFriends':
      handleGetFriends(ws, data);
      break;

    case 'getFriendRequests':
      handleGetFriendRequests(ws, data);
      break;

    case 'acceptFriendRequest':
      handleAcceptFriendRequest(ws, data);
      break;

    case 'declineFriendRequest':
      handleDeclineFriendRequest(ws, data);
      break;

    case 'getNotifications':
      handleGetNotifications(ws, data);
      break;

    case 'markNotificationRead':
      handleMarkNotificationRead(ws, data);
      break;

    case 'markAllNotificationsRead':
      handleMarkAllNotificationsRead(ws, data);
      break;

    case 'deleteNotification':
      handleDeleteNotification(ws, data);
      break;

    case 'clearAllNotifications':
      handleClearAllNotifications(ws, data);
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }));
  }
}

// Handle user authentication
function handleUserAuthentication(ws, data) {
  const { scratchAuth } = data;

  if (scratchAuth && scratchAuth.isLoggedIn) {
    // Store authenticated Scratch user
    scratchUsers.set(ws.clientId, {
      clientId: ws.clientId,
      username: scratchAuth.username,
      userId: scratchAuth.userId,
      avatar: scratchAuth.avatar,
      profileUrl: scratchAuth.profileUrl,
      authenticatedAt: Date.now()
    });

    ws.isAuthenticated = true;
    ws.scratchUser = scratchAuth;

    console.log(`User ${scratchAuth.username} authenticated`);

    ws.send(JSON.stringify({
      type: 'authenticated',
      success: true,
      username: scratchAuth.username,
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'authenticated',
      success: false,
      message: 'Invalid authentication data',
      timestamp: Date.now()
    }));
  }
}

// Handle client joining a project
function handleJoinProject(ws, data) {
  const { projectId, userName, scratchAuth } = data;

  if (!projectId || !userName) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Project ID and user name are required'
    }));
    return;
  }

  // Create or get existing session
  if (!collaborationSessions.has(projectId)) {
    collaborationSessions.set(projectId, {
      projectId,
      participants: new Map(),
      created: Date.now()
    });
  }

  const session = collaborationSessions.get(projectId);

  // Get user display name (prefer Scratch username if authenticated)
  let displayName = userName;
  let userProfile = null;

  if (ws.isAuthenticated && ws.scratchUser) {
    displayName = ws.scratchUser.username;
    userProfile = {
      username: ws.scratchUser.username,
      avatar: ws.scratchUser.avatar,
      profileUrl: ws.scratchUser.profileUrl
    };
  }

  // Add participant to session
  session.participants.set(ws.clientId, {
    clientId: ws.clientId,
    userName: displayName,
    ws,
    joinedAt: Date.now(),
    profile: userProfile,
    isAuthenticated: ws.isAuthenticated || false
  });

  ws.projectId = projectId;
  ws.userName = displayName;

  console.log(`${displayName} joined project ${projectId}`);

  // Notify all participants about the new user
  broadcastToProject(projectId, {
    type: 'userJoined',
    userName: displayName,
    clientId: ws.clientId,
    participantCount: session.participants.size,
    profile: userProfile,
    timestamp: Date.now()
  }, ws.clientId); // Exclude sender

  // Send current participants list to the new user
  const participantsList = Array.from(session.participants.values()).map(p => ({
    clientId: p.clientId,
    userName: p.userName,
    joinedAt: p.joinedAt,
    profile: p.profile,
    isAuthenticated: p.isAuthenticated
  }));

  ws.send(JSON.stringify({
    type: 'participantsList',
    participants: participantsList,
    timestamp: Date.now()
  }));

  // Send join confirmation
  ws.send(JSON.stringify({
    type: 'joined',
    projectId,
    participantCount: session.participants.size,
    timestamp: Date.now()
  }));
}

// Handle client leaving a project
function handleLeaveProject(ws, data) {
  const { projectId } = data;
  const sessionProjectId = projectId || ws.projectId;

  if (sessionProjectId && collaborationSessions.has(sessionProjectId)) {
    const session = collaborationSessions.get(sessionProjectId);

    if (session.participants.has(ws.clientId)) {
      const participant = session.participants.get(ws.clientId);
      const userName = participant.userName;

      // Remove participant from session
      session.participants.delete(ws.clientId);

      console.log(`${userName} left project ${sessionProjectId}`);

      // If no more participants, remove the session
      if (session.participants.size === 0) {
        collaborationSessions.delete(sessionProjectId);
        console.log(`Session for project ${sessionProjectId} removed`);
      } else {
        // Notify remaining participants
        broadcastToProject(sessionProjectId, {
          type: 'userLeft',
          userName,
          clientId: ws.clientId,
          participantCount: session.participants.size,
          timestamp: Date.now()
        });
      }
    }
  }
}

// Handle project updates
function handleProjectUpdate(ws, data) {
  const { projectId, updateData } = data;

  if (!ws.projectId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not joined to any project'
    }));
    return;
  }

  // Broadcast update to all other participants in the same project
  broadcastToProject(ws.projectId, {
    type: 'projectUpdate',
    userName: ws.userName,
    clientId: ws.clientId,
    data: updateData,
    timestamp: Date.now()
  }, ws.clientId); // Exclude sender
}

// Handle cursor movements
function handleCursorMove(ws, data) {
  const { projectId, position } = data;

  if (!ws.projectId) {
    return;
  }

  // Broadcast cursor position to all other participants
  broadcastToProject(ws.projectId, {
    type: 'cursorMove',
    userName: ws.userName,
    clientId: ws.clientId,
    position,
    timestamp: Date.now()
  }, ws.clientId); // Exclude sender
}

// Handle chat messages
function handleChatMessage(ws, data) {
  const { projectId, message } = data;

  if (!ws.projectId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'You must join a project before sending chat messages'
    }));
    return;
  }

  if (!message || message.trim() === '') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message cannot be empty'
    }));
    return;
  }

  // Validate message length (max 500 characters)
  if (message.length > 500) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message too long (max 500 characters)'
    }));
    return;
  }

  // Broadcast chat message to all participants in the project (including sender)
  broadcastToProject(ws.projectId, {
    type: 'chatMessage',
    userName: ws.userName,
    clientId: ws.clientId,
    message: message.trim(),
    timestamp: Date.now()
  });
}

// Handle friend invitation
function handleFriendInvitation(ws, data) {
  const { friendUsername, projectId } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required for friend invitations'
    }));
    return;
  }

  if (!friendUsername) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Friend username is required'
    }));
    return;
  }

  const requesterUsername = ws.scratchUser.username;

  // Check if user exists (in a real implementation, you'd check against Scratch API)
  if (!isValidScratchUser(friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `User '${friendUsername}' not found on Scratch`
    }));
    return;
  }

  // Check if they're already friends
  if (areUsersFriends(requesterUsername, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `You are already friends with ${friendUsername}`
    }));
    return;
  }

  // Check if there's already a pending request
  if (hasPendingFriendRequest(requesterUsername, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Friend request already sent to ${friendUsername}`
    }));
    return;
  }

  // Send friend request
  addFriendRequest(requesterUsername, friendUsername);

  // Notify the target user if they're online
  notifyUserOfFriendRequest(friendUsername, {
    from: requesterUsername,
    projectId: projectId,
    timestamp: Date.now()
  });

  ws.send(JSON.stringify({
    type: 'friendInvitationSent',
    friendUsername: friendUsername,
    timestamp: Date.now()
  }));
}

// Handle add friend request
function handleAddFriend(ws, data) {
  const { friendUsername } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!friendUsername) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Friend username is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  // Check if user exists
  if (!isValidScratchUser(friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `User '${friendUsername}' not found on Scratch`
    }));
    return;
  }

  // Check if they're already friends
  if (areUsersFriends(username, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `You are already friends with ${friendUsername}`
    }));
    return;
  }

  // Check if there's already a pending request
  if (hasPendingFriendRequest(username, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Friend request already sent to ${friendUsername}`
    }));
    return;
  }

  // Send friend request
  addFriendRequest(username, friendUsername);

  ws.send(JSON.stringify({
    type: 'friendRequestSent',
    friendUsername: friendUsername,
    timestamp: Date.now()
  }));
}

// Handle remove friend
function handleRemoveFriend(ws, data) {
  const { friendUsername } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!friendUsername) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Friend username is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (removeFriend(username, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'friendRemoved',
      friendUsername: friendUsername,
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: `${friendUsername} is not in your friends list`
    }));
  }
}

// Handle get friends list
function handleGetFriends(ws, data) {
  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const username = ws.scratchUser.username;
  const friends = getUserFriends(username);

  ws.send(JSON.stringify({
    type: 'friendsList',
    friends: friends,
    timestamp: Date.now()
  }));
}

// Handle get friend requests
function handleGetFriendRequests(ws, data) {
  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const username = ws.scratchUser.username;
  const requests = getUserFriendRequests(username);

  ws.send(JSON.stringify({
    type: 'friendRequests',
    requests: requests,
    timestamp: Date.now()
  }));
}

// Handle accept friend request
function handleAcceptFriendRequest(ws, data) {
  const { requesterUsername } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!requesterUsername) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Requester username is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (acceptFriendRequest(requesterUsername, username)) {
    // Notify both users
    notifyUserOfFriendAcceptance(requesterUsername, username);

    ws.send(JSON.stringify({
      type: 'friendRequestAccepted',
      friendUsername: requesterUsername,
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Friend request not found'
    }));
  }
}

// Handle decline friend request
function handleDeclineFriendRequest(ws, data) {
  const { requesterUsername } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!requesterUsername) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Requester username is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (declineFriendRequest(requesterUsername, username)) {
    ws.send(JSON.stringify({
      type: 'friendRequestDeclined',
      requesterUsername: requesterUsername,
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Friend request not found'
    }));
  }
}

// Helper functions for friend management
function isValidScratchUser(username) {
  // In a real implementation, this would check against Scratch's API
  // For now, we'll assume any non-empty username is valid
  return username && username.trim().length > 0 && username.length <= 20;
}

function areUsersFriends(username1, username2) {
  const friends1 = getUserFriends(username1);
  return friends1.some(friend => friend.username === username2);
}

function hasPendingFriendRequest(fromUsername, toUsername) {
  const requests = getUserFriendRequests(toUsername);
  return requests.some(request => request.from === fromUsername);
}

function addFriendRequest(fromUsername, toUsername) {
  if (!friendRequests.has(toUsername)) {
    friendRequests.set(toUsername, []);
  }

  const requests = friendRequests.get(toUsername);
  requests.push({
    from: fromUsername,
    to: toUsername,
    timestamp: Date.now(),
    status: 'pending'
  });
}

function removeFriend(username, friendUsername) {
  if (!friendsData.has(username)) {
    return false;
  }

  const friends = friendsData.get(username);
  const index = friends.findIndex(friend => friend.username === friendUsername);

  if (index === -1) {
    return false;
  }

  friends.splice(index, 1);

  // Also remove from the other user's friends list
  if (friendsData.has(friendUsername)) {
    const otherFriends = friendsData.get(friendUsername);
    const otherIndex = otherFriends.findIndex(friend => friend.username === username);
    if (otherIndex !== -1) {
      otherFriends.splice(otherIndex, 1);
    }
  }

  return true;
}

function getUserFriends(username) {
  if (!friendsData.has(username)) {
    friendsData.set(username, []);
  }
  return friendsData.get(username);
}

function getUserFriendRequests(username) {
  if (!friendRequests.has(username)) {
    friendRequests.set(username, []);
  }
  return friendRequests.get(username);
}

function acceptFriendRequest(requesterUsername, targetUsername) {
  // Remove the friend request
  const requests = friendRequests.get(targetUsername) || [];
  const requestIndex = requests.findIndex(req => req.from === requesterUsername);

  if (requestIndex === -1) {
    return false;
  }

  requests.splice(requestIndex, 1);

  // Add to both users' friends lists
  if (!friendsData.has(requesterUsername)) {
    friendsData.set(requesterUsername, []);
  }
  if (!friendsData.has(targetUsername)) {
    friendsData.set(targetUsername, []);
  }

  const requesterFriends = friendsData.get(requesterUsername);
  const targetFriends = friendsData.get(targetUsername);

  // Add friend info
  const friendInfo = {
    username: targetUsername,
    addedAt: Date.now(),
    status: 'online' // Will be updated based on actual status
  };

  const requesterInfo = {
    username: requesterUsername,
    addedAt: Date.now(),
    status: 'online'
  };

  requesterFriends.push(friendInfo);
  targetFriends.push(requesterInfo);

  return true;
}

function declineFriendRequest(requesterUsername, targetUsername) {
  const requests = friendRequests.get(targetUsername) || [];
  const requestIndex = requests.findIndex(req => req.from === requesterUsername);

  if (requestIndex === -1) {
    return false;
  }

  requests.splice(requestIndex, 1);
  return true;
}

function notifyUserOfFriendRequest(targetUsername, requestData) {
  // Find all WebSocket connections for the target user
  wss.clients.forEach(client => {
    if (client.isAuthenticated && client.scratchUser &&
        client.scratchUser.username === targetUsername &&
        client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'friendRequestReceived',
        from: requestData.from,
        projectId: requestData.projectId,
        timestamp: requestData.timestamp
      }));
    }
  });
}

function notifyUserOfFriendAcceptance(requesterUsername, targetUsername) {
  // Notify both users
  wss.clients.forEach(client => {
    if (client.isAuthenticated && client.readyState === WebSocket.OPEN) {
      const username = client.scratchUser.username;

      if (username === requesterUsername || username === targetUsername) {
        client.send(JSON.stringify({
          type: 'friendAdded',
          friendUsername: username === requesterUsername ? targetUsername : requesterUsername,
          timestamp: Date.now()
        }));
      }
    }
  });
}

// Handle get notifications
function handleGetNotifications(ws, data) {
  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const username = ws.scratchUser.username;
  const notifications = getUserNotifications(username);

  ws.send(JSON.stringify({
    type: 'notificationsList',
    notifications: notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    timestamp: Date.now()
  }));
}

// Handle mark notification as read
function handleMarkNotificationRead(ws, data) {
  const { notificationId } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!notificationId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Notification ID is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (markNotificationAsRead(username, notificationId)) {
    ws.send(JSON.stringify({
      type: 'notificationMarkedRead',
      notificationId: notificationId,
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Notification not found'
    }));
  }
}

// Handle mark all notifications as read
function handleMarkAllNotificationsRead(ws, data) {
  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (markAllNotificationsAsRead(username)) {
    ws.send(JSON.stringify({
      type: 'allNotificationsMarkedRead',
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to mark notifications as read'
    }));
  }
}

// Handle delete notification
function handleDeleteNotification(ws, data) {
  const { notificationId } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!notificationId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Notification ID is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (deleteNotification(username, notificationId)) {
    ws.send(JSON.stringify({
      type: 'notificationDeleted',
      notificationId: notificationId,
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Notification not found'
    }));
  }
}

// Handle clear all notifications
function handleClearAllNotifications(ws, data) {
  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  if (clearAllNotifications(username)) {
    ws.send(JSON.stringify({
      type: 'allNotificationsCleared',
      timestamp: Date.now()
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to clear notifications'
    }));
  }
}

// Helper functions for notifications
function getUserNotifications(username) {
  if (!notificationsData.has(username)) {
    notificationsData.set(username, []);
  }
  return notificationsData.get(username);
}

function addNotification(username, type, title, message, data = {}) {
  if (!notificationsData.has(username)) {
    notificationsData.set(username, []);
  }

  const notifications = notificationsData.get(username);
  const notification = {
    id: generateNotificationId(),
    type: type,
    title: title,
    message: message,
    data: data,
    timestamp: Date.now(),
    read: false
  };

  notifications.unshift(notification); // Add to beginning for chronological order

  // Keep only last 100 notifications per user
  if (notifications.length > 100) {
    notifications.splice(100);
  }

  return notification;
}

function markNotificationAsRead(username, notificationId) {
  const notifications = getUserNotifications(username);
  const notification = notifications.find(n => n.id === notificationId);

  if (notification) {
    notification.read = true;
    return true;
  }

  return false;
}

function markAllNotificationsAsRead(username) {
  const notifications = getUserNotifications(username);
  let markedAny = false;

  notifications.forEach(notification => {
    if (!notification.read) {
      notification.read = true;
      markedAny = true;
    }
  });

  return markedAny;
}

function deleteNotification(username, notificationId) {
  const notifications = getUserNotifications(username);
  const index = notifications.findIndex(n => n.id === notificationId);

  if (index !== -1) {
    notifications.splice(index, 1);
    return true;
  }

  return false;
}

function clearAllNotifications(username) {
  notificationsData.set(username, []);
  return true;
}

function generateNotificationId() {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Enhanced friend request handler to create notifications
function handleAddFriend(ws, data) {
  const { friendUsername } = data;

  if (!ws.isAuthenticated || !ws.scratchUser) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }));
    return;
  }

  if (!friendUsername) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Friend username is required'
    }));
    return;
  }

  const username = ws.scratchUser.username;

  // Check if user exists
  if (!isValidScratchUser(friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `User '${friendUsername}' not found on Scratch`
    }));
    return;
  }

  // Check if they're already friends
  if (areUsersFriends(username, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `You are already friends with ${friendUsername}`
    }));
    return;
  }

  // Check if there's already a pending request
  if (hasPendingFriendRequest(username, friendUsername)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Friend request already sent to ${friendUsername}`
    }));
    return;
  }

  // Send friend request and create notification for target user
  addFriendRequest(username, friendUsername);

  // Create notification for the target user
  addNotification(friendUsername, 'friendRequest', 'Freundschaftsanfrage',
    `${username} möchte Ihr Freund sein`, {
      from: username,
      type: 'friendRequest'
    });

  ws.send(JSON.stringify({
    type: 'friendRequestSent',
    friendUsername: friendUsername,
    timestamp: Date.now()
  }));
}

// Enhanced notification creation for various events
function notifyUserOfFriendRequest(targetUsername, requestData) {
  // Find all WebSocket connections for the target user
  wss.clients.forEach(client => {
    if (client.isAuthenticated && client.scratchUser &&
        client.scratchUser.username === targetUsername &&
        client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'friendRequestReceived',
        from: requestData.from,
        projectId: requestData.projectId,
        timestamp: requestData.timestamp
      }));
    }
  });

  // Also create a notification
  addNotification(targetUsername, 'friendRequest', 'Freundschaftsanfrage erhalten',
    `${requestData.from} hat Ihnen eine Freundschaftsanfrage gesendet`, {
      from: requestData.from,
      projectId: requestData.projectId,
      type: 'friendRequest'
    });
}

function notifyUserOfFriendAcceptance(requesterUsername, targetUsername) {
  // Notify both users
  wss.clients.forEach(client => {
    if (client.isAuthenticated && client.readyState === WebSocket.OPEN) {
      const username = client.scratchUser.username;

      if (username === requesterUsername || username === targetUsername) {
        client.send(JSON.stringify({
          type: 'friendAdded',
          friendUsername: username === requesterUsername ? targetUsername : requesterUsername,
          timestamp: Date.now()
        }));
      }
    }
  });

  // Create notifications
  addNotification(requesterUsername, 'friendAccepted', 'Freundschaftsanfrage angenommen',
    `${targetUsername} hat Ihre Freundschaftsanfrage angenommen`, {
      friendUsername: targetUsername,
      type: 'friendAccepted'
    });

  addNotification(targetUsername, 'friendAccepted', 'Freundschaftsanfrage angenommen',
    `Sie haben die Freundschaftsanfrage von ${requesterUsername} angenommen`, {
      friendUsername: requesterUsername,
      type: 'friendAccepted'
    });
}

// Handle client disconnect
function handleClientDisconnect(ws) {
  if (ws.projectId && collaborationSessions.has(ws.projectId)) {
    handleLeaveProject(ws, { projectId: ws.projectId });
  }
}

// Broadcast message to all participants in a project (including sender)
function broadcastToProject(projectId, message, excludeClientId = null) {
  if (!collaborationSessions.has(projectId)) {
    return;
  }

  const session = collaborationSessions.get(projectId);
  const messageStr = JSON.stringify(message);

  session.participants.forEach((participant, clientId) => {
    if (participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(messageStr);
    }
  });
}

// Root endpoint - serve the start page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// REST API endpoints
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(collaborationSessions.entries()).map(([projectId, session]) => ({
    projectId,
    participantCount: session.participants.size,
    created: session.created
  }));

  res.json({
    sessions,
    totalSessions: sessions.length
  });
});

app.get('/api/sessions/:projectId', (req, res) => {
  const { projectId } = req.params;

  if (!collaborationSessions.has(projectId)) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  const session = collaborationSessions.get(projectId);
  const participants = Array.from(session.participants.values()).map(p => ({
    clientId: p.clientId,
    userName: p.userName,
    joinedAt: p.joinedAt
  }));

  res.json({
    projectId,
    participants,
    participantCount: participants.length,
    created: session.created
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: Date.now(),
    uptime: process.uptime(),
    activeSessions: collaborationSessions.size,
    connections: wss.clients.size
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Scratch Collaboration Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');

  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close();
  });

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
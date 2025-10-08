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

  if (!ws.projectId || !message || message.trim() === '') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Project ID and message are required'
    }));
    return;
  }

  // Broadcast chat message to all participants in the project
  broadcastToProject(ws.projectId, {
    type: 'chatMessage',
    userName: ws.userName,
    clientId: ws.clientId,
    message: message.trim(),
    timestamp: Date.now()
  });
}

// Handle client disconnect
function handleClientDisconnect(ws) {
  if (ws.projectId && collaborationSessions.has(ws.projectId)) {
    handleLeaveProject(ws, { projectId: ws.projectId });
  }
}

// Broadcast message to all participants in a project except sender
function broadcastToProject(projectId, message, excludeClientId = null) {
  if (!collaborationSessions.has(projectId)) {
    return;
  }

  const session = collaborationSessions.get(projectId);
  const messageStr = JSON.stringify(message);

  session.participants.forEach((participant, clientId) => {
    if (clientId !== excludeClientId && participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(messageStr);
    }
  });
}

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
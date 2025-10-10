// Background script for Scratch Collaboration Extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Scratch Collaboration Extension installed');

    // Initialize default settings
    chrome.storage.local.set({
      collaborationEnabled: false,
      serverUrl: 'http://localhost:3000',
      userName: 'Anonymous',
      currentProject: null,
      setupCompleted: false // Setup must be completed by user
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startCollaboration':
      handleStartCollaboration(request, sendResponse);
      return true; // Keep message channel open for async response

    case 'stopCollaboration':
      handleStopCollaboration(request, sendResponse);
      return true;

    case 'getCollaborationStatus':
      getCollaborationStatus(sendResponse);
      return true;

    case 'updateProject':
      handleProjectUpdate(request, sendResponse);
      return true;

    case 'chatMessageReceived':
      handleChatMessageReceived(request, sendResponse);
      return true;

    case 'scratchAuthDetected':
      handleScratchAuthDetected(request, sendResponse);
      return true;

    case 'participantsListUpdated':
      handleParticipantsListUpdated(request, sendResponse);
      return true;

    case 'startServer':
      handleStartServer(request, sendResponse);
      return true;
  }
});

// Handle starting collaboration session
async function handleStartCollaboration(request, sendResponse) {
  try {
    const { projectId, userName } = request;

    // Update stored settings
    await chrome.storage.local.set({
      collaborationEnabled: true,
      currentProject: projectId,
      userName: userName || 'Anonymous'
    });

    // Notify content script to start collaboration
    chrome.tabs.query({ url: 'https://scratch.mit.edu/projects/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'collaborationStarted',
          projectId: projectId,
          userName: userName
        });
      });
    });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle stopping collaboration session
async function handleStopCollaboration(request, sendResponse) {
  try {
    // Update stored settings
    await chrome.storage.local.set({
      collaborationEnabled: false,
      currentProject: null
    });

    // Notify content script to stop collaboration
    chrome.tabs.query({ url: 'https://scratch.mit.edu/projects/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'collaborationStopped'
        });
      });
    });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get current collaboration status
async function getCollaborationStatus(sendResponse) {
  try {
    const result = await chrome.storage.local.get([
      'collaborationEnabled',
      'serverUrl',
      'userName',
      'currentProject'
    ]);

    sendResponse({
      success: true,
      status: result
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle project updates from content script
async function handleProjectUpdate(request, sendResponse) {
  try {
    const { projectData } = request;

    // Get current settings
    const result = await chrome.storage.local.get(['serverUrl', 'userName']);

    if (result.collaborationEnabled) {
      // Send update to server (will be implemented when server is ready)
      console.log('Project update received:', projectData);

      // For now, just acknowledge
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Collaboration not enabled' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle chat messages received from content script
async function handleChatMessageReceived(request, sendResponse) {
  try {
    const { userName, chatMessage, timestamp } = request;

    // Forward chat message to popup
    chrome.runtime.sendMessage({
      action: 'displayChatMessage',
      userName: userName,
      message: chatMessage,
      timestamp: timestamp
    });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle Scratch authentication detection
async function handleScratchAuthDetected(request, sendResponse) {
  try {
    const { authInfo } = request;

    // Forward auth info to popup
    chrome.runtime.sendMessage({
      action: 'scratchAuthDetected',
      authInfo: authInfo
    });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle participants list updates
async function handleParticipantsListUpdated(request, sendResponse) {
  try {
    const { participants } = request;

    // Forward participants list to popup
    chrome.runtime.sendMessage({
      action: 'participantsListUpdated',
      participants: participants
    });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle starting the collaboration server
async function handleStartServer(request, sendResponse) {
  try {
    // Use exec to start the server in a new terminal
    const { exec } = require('child_process');
    const path = require('path');

    // Get the extension directory path
    const extensionPath = chrome.runtime.getURL('.').replace('chrome-extension://', '');
    const serverPath = path.join(extensionPath, '..', 'server');

    // Start the server
    exec('cd "' + serverPath + '" && npm start', (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting server:', error);
        sendResponse({ success: false, error: error.message });
        return;
      }

      console.log('Server started successfully:', stdout);
      sendResponse({ success: true });
    });

  } catch (error) {
    console.error('Error in handleStartServer:', error);
    sendResponse({ success: false, error: error.message });
  }
}
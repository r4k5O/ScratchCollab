// Background script for Scratch Collaboration Extension

// Check if we're in a service worker context and APIs are available
console.log('Background script loaded');
console.log('Chrome runtime available:', typeof chrome !== 'undefined' && chrome.runtime);
console.log('Chrome storage available:', typeof chrome !== 'undefined' && chrome.storage);
console.log('Chrome tabs available:', typeof chrome !== 'undefined' && chrome.tabs);

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  try {
    if (details.reason === 'install') {
      console.log('Scratch Collaboration Extension installed');

      // Initialize default settings
      chrome.storage.local.set({
        collaborationEnabled: false,
        serverUrl: 'http://localhost:3000',
        userName: 'Anonymous',
        currentProject: null,
        setupCompleted: false // Setup must be completed by user
        // introductionSeen removed - feature disabled
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting storage:', chrome.runtime.lastError);
        }
      });

      // Introduction page disabled - was causing file access issues
      console.log('Introduction page feature disabled due to file access issues');
    }
  } catch (error) {
    console.error('Error in onInstalled listener:', error);
  }
});

// Introduction page feature disabled - onStartup listener removed
console.log('Introduction page feature disabled');

// Introduction page function removed - feature disabled

// Context menu for introduction page removed - feature disabled

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
      userName: userName // Preserve whatever username was provided, don't fallback to Anonymous
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

    // Chat messages are now handled directly by content script
    // No need to forward to popup through background script
    console.log('Chat message received:', { userName, chatMessage, timestamp });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle Scratch authentication detection
async function handleScratchAuthDetected(request, sendResponse) {
  try {
    const { authInfo } = request;

    // Auth info is now handled directly by content script
    // No need to forward to popup through background script
    console.log('Scratch auth detected:', authInfo);

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle participants list updates
async function handleParticipantsListUpdated(request, sendResponse) {
  try {
    const { participants } = request;

    // Participants list is now handled directly by content script
    // No need to forward to popup through background script
    console.log('Participants list updated:', participants);

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

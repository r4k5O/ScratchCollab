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
        setupCompleted: false, // Setup must be completed by user
        introductionSeen: false // Track if introduction has been shown
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting storage:', chrome.runtime.lastError);
        }
      });

      // Show introduction page on first install
      setTimeout(() => {
        try {
          showIntroductionPage();
        } catch (error) {
          console.error('Error showing introduction page:', error);
        }
      }, 1000); // Small delay to ensure extension is fully loaded
    }
  } catch (error) {
    console.error('Error in onInstalled listener:', error);
  }
});

// Check if introduction should be shown on browser startup
chrome.runtime.onStartup.addListener(() => {
  try {
    // Check both chrome.storage and localStorage for introduction status
    chrome.storage.local.get(['introductionSeen'], (result) => {
      const chromeStorageSeen = result.introductionSeen;

      // Also check localStorage as fallback
      let localStorageSeen = false;
      try {
        localStorageSeen = localStorage.getItem('scratchCollab_introductionSeen') === 'true';
      } catch (e) {
        console.warn('localStorage not available');
      }

      // Show introduction if not seen in either storage
      if (!chromeStorageSeen && !localStorageSeen) {
        showIntroductionPage();
      }
    });
  } catch (error) {
    console.error('Error in onStartup listener:', error);
  }
});

// Function to show the introduction page
function showIntroductionPage() {
  try {
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html'),
        active: true
      }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('Error creating tab:', chrome.runtime.lastError.message);
        } else {
          console.log('Introduction page opened in tab:', tab.id);
        }
      });
    } else {
      console.error('Tabs API not available');
    }
  } catch (error) {
    console.error('Error in showIntroductionPage:', error);
  }
}

// Add context menu for testing introduction page (with error handling)
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Check if contextMenus API is available
    if (chrome.contextMenus && chrome.contextMenus.create) {
      try {
        chrome.contextMenus.create({
          id: 'showIntroduction',
          title: 'Einführung erneut anzeigen',
          contexts: ['action']
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn('Could not create context menu:', chrome.runtime.lastError.message);
          } else {
            console.log('Context menu created successfully');
          }
        });
      } catch (error) {
        console.warn('Context menus not supported:', error);
      }
    } else {
      console.log('ContextMenus API not available');
    }
  }
});

// Handle context menu clicks (with error handling)
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    try {
      if (info.menuItemId === 'showIntroduction') {
        console.log('Resetting introduction flag and showing page');
        chrome.storage.local.set({ introductionSeen: false }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error resetting introduction flag:', chrome.runtime.lastError);
          } else {
            showIntroductionPage();
          }
        });
      }
    } catch (error) {
      console.error('Error in context menu handler:', error);
    }
  });
}

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

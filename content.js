// Content script for Scratch Collaboration Extension

class ScratchCollaboration {
  constructor() {
    this.isCollaborating = false;
    this.projectId = null;
    this.userName = 'Anonymous';
    this.serverUrl = 'http://localhost:3000';
    this.socket = null;
    this.projectMonitor = null;

    this.init();
  }

  init() {
    // Wait for Scratch to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('Scratch Collaboration content script loaded');

    // Detect Scratch language first
    this.detectScratchLanguage();

    // Detect Scratch authentication status
    this.detectScratchAuth();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'collaborationStarted':
          this.startCollaboration(request.projectId, request.userName);
          sendResponse({ success: true });
          break;

        case 'collaborationStopped':
          this.stopCollaboration();
          sendResponse({ success: true });
          break;

        case 'sendChatMessage':
          this.sendChatMessage(request.message);
          sendResponse({ success: true });
          break;

        case 'sendFriendInvitation':
          this.sendFriendInvitation(request.friendUsername);
          sendResponse({ success: true });
          break;
      }
      return true;
    });

    // Load current settings
    this.loadSettings();

    // Add collaboration UI to Scratch interface
    this.addCollaborationUI();

    // Set up cursor tracking
    this.trackCursorMovement();

    // Initialize cursor preview system
    this.initCursorPreview();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'collaborationEnabled',
        'serverUrl',
        'userName',
        'currentProject'
      ]);

      this.isCollaborating = result.collaborationEnabled || false;
      this.serverUrl = result.serverUrl || 'http://localhost:3000';
      this.userName = result.userName || 'Anonymous';

      if (result.currentProject) {
        this.projectId = result.currentProject;
      }

      if (this.isCollaborating) {
        this.startCollaboration(this.projectId, this.userName);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  startCollaboration(projectId, userName) {
    if (this.isCollaborating) {
      this.stopCollaboration();
    }

    this.projectId = projectId || this.extractProjectId();
    this.userName = userName;
    this.isCollaborating = true;

    console.log(`Starting collaboration for project ${this.projectId} as ${this.userName}`);

    // Connect to collaboration server
    this.connectToServer();

    // Start monitoring project changes
    this.startProjectMonitoring();

    // Update UI
    this.updateCollaborationUI();
  }

  stopCollaboration() {
    console.log('Stopping collaboration');

    this.isCollaborating = false;
    this.projectId = null;

    // Disconnect from server
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Stop monitoring
    if (this.projectMonitor) {
      clearInterval(this.projectMonitor);
      this.projectMonitor = null;
    }

    // Clean up remote cursors
    this.cleanupRemoteCursors();

    // Hide status immediately
    this.hideCollaborationStatus();

    // Update UI
    this.updateCollaborationUI();
  }

  extractProjectId() {
    // Extract project ID from current Scratch URL
    const match = window.location.href.match(/\/projects\/(\d+)/);
    return match ? match[1] : null;
  }

  connectToServer() {
    try {
      console.log(`Connecting to collaboration server at ${this.serverUrl}`);

      // Create WebSocket connection
      this.socket = new WebSocket(this.serverUrl.replace('http', 'ws'));

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log('Connection timeout - closing socket');
          this.socket.close();
          this.socket = null;
          this.showNotification('Connection timeout - please check server URL');
          this.hideCollaborationStatus();
        }
      }, 10000); // 10 second timeout

      this.socket.onopen = () => {
        console.log('Connected to collaboration server');
        clearTimeout(connectionTimeout);
        this.onServerConnected();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('Error parsing server message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('Disconnected from collaboration server:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        this.socket = null;

        // Hide status if connection was lost
        this.hideCollaborationStatus();

        // Attempt to reconnect if still collaborating
        if (this.isCollaborating) {
          setTimeout(() => {
            if (this.isCollaborating) {
              this.connectToServer();
            }
          }, 3000);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        this.hideCollaborationStatus();
      };

    } catch (error) {
      console.error('Error connecting to server:', error);
      this.hideCollaborationStatus();
    }
  }

  onServerConnected() {
    // First authenticate with Scratch account if available
    if (this.scratchAuth && this.scratchAuth.isLoggedIn) {
      const authMessage = {
        type: 'authenticate',
        scratchAuth: this.scratchAuth,
        timestamp: Date.now()
      };

      console.log('Sending authentication message:', authMessage);

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(authMessage));
      }
    }

    // Then join the project
    setTimeout(() => {
      this.sendJoinMessage();
    }, 100); // Small delay to ensure authentication is processed first

    // Listen for collaboration events from other users
    this.listenForCollaborationEvents();
  }

  sendJoinMessage() {
    const joinMessage = {
      type: 'join',
      projectId: this.projectId,
      userName: this.userName,
      scratchAuth: this.scratchAuth,
      timestamp: Date.now()
    };

    console.log('Sending join message:', joinMessage);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(joinMessage));
    }
  }

  handleServerMessage(message) {
    console.log('Received server message:', message);

    switch (message.type) {
      case 'welcome':
        console.log('Received welcome message, client ID:', message.clientId);
        break;

      case 'authenticated':
        console.log('Authentication response:', message.success ? 'successful' : 'failed');
        if (message.success) {
          this.isAuthenticated = true;
          console.log('User authenticated with server');
        }
        break;

      case 'joined':
        console.log(`Successfully joined project ${message.projectId}`);
        this.showNotification(`Connected to collaboration session`);
        break;

      case 'userJoined':
        this.showNotification(`${message.userName} joined the collaboration`);
        this.updateParticipantsList();
        break;

      case 'userLeft':
        this.showNotification(`${message.userName} left the collaboration`);
        this.updateParticipantsList();
        break;

      case 'participantsList':
        this.handleParticipantsList(message.participants);
        break;

      case 'projectUpdate':
        this.applyProjectUpdate(message);
        break;

      case 'cursorMove':
        this.updateCursorPosition(message);
        break;

      case 'chatMessage':
        this.handleChatMessage(message);
        break;

      case 'error':
        console.error('Server error:', message.message);
        this.showNotification(`Error: ${message.message}`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleParticipantsList(participants) {
    console.log('Participants list updated:', participants);
    // Store participants list for UI updates
    this.participants = participants;
    this.updateParticipantsUI();

    // Send participants info to popup for display
    chrome.runtime.sendMessage({
      action: 'participantsListUpdated',
      participants: participants
    });
  }

  updateParticipantsList() {
    // Request current participants list from server
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
    }
  }

  updateParticipantsUI() {
    // Update participants in popup if it's a new participant event
    // The popup will handle the actual display
    chrome.runtime.sendMessage({
      action: 'participantsUpdated',
      participants: this.participants || []
    });
  }

  listenForCollaborationEvents() {
    // Listen for changes from other collaborators
    // This will be implemented with WebSocket events
    console.log('Listening for collaboration events');
  }

  startProjectMonitoring() {
    if (this.projectMonitor) {
      clearInterval(this.projectMonitor);
    }

    // Monitor for project changes every 2 seconds
    this.projectMonitor = setInterval(() => {
      if (this.isCollaborating) {
        this.checkForProjectChanges();
      }
    }, 2000);
  }

  checkForProjectChanges() {
    // Get current project data from Scratch
    const projectData = this.getProjectData();

    if (projectData && this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send project update to server
      const updateMessage = {
        type: 'projectUpdate',
        projectId: this.projectId,
        updateData: projectData,
        timestamp: Date.now()
      };

      this.socket.send(JSON.stringify(updateMessage));
    }
  }

  getProjectData() {
    try {
      // Try to access Scratch VM or project data
      // This is a simplified version - actual implementation would need to
      // access Scratch's internal data structures
      const projectInfo = {
        projectId: this.projectId,
        userName: this.userName,
        timestamp: Date.now(),
        // In a real implementation, we would extract:
        // - Sprite data
        // - Script blocks
        // - Stage data
        // - Variables
        // - etc.
        status: 'active'
      };

      return projectInfo;
    } catch (error) {
      console.error('Error getting project data:', error);
      return null;
    }
  }

  addCollaborationUI() {
    // Add collaboration status indicator to Scratch interface
    const statusDiv = document.createElement('div');
    statusDiv.id = 'scratch-collab-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10000;
      display: none;
      cursor: pointer;
      user-select: none;
    `;

    // Add close button to status
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = ' ×';
    closeBtn.style.cssText = `
      margin-left: 8px;
      font-size: 14px;
      font-weight: bold;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.opacity = '1';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.opacity = '0.7';
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideCollaborationStatus();
    });

    statusDiv.appendChild(closeBtn);
    document.body.appendChild(statusDiv);
    this.statusElement = statusDiv;

    // Auto-hide after 10 seconds if still showing
    setTimeout(() => {
      if (statusDiv && statusDiv.style.display !== 'none') {
        this.hideCollaborationStatus();
      }
    }, 10000);

    // Add "Share with ScratchCollab" button
    this.addShareButton();
  }

  // Add share button to Scratch interface
  addShareButton() {
    // Wait for Scratch interface to load
    const checkForScratchUI = () => {
      // Look for Scratch's share button area or toolbar
      const shareAreas = [
        '.share-button',
        '.project-buttons',
        '.controls',
        '[data-control="share"]',
        '.action-buttons'
      ];

      for (let selector of shareAreas) {
        const element = document.querySelector(selector);
        if (element) {
          this.insertShareButton(element);
          return;
        }
      }

      // If not found, try again after a short delay
      setTimeout(checkForScratchUI, 1000);
    };

    setTimeout(checkForScratchUI, 2000); // Wait 2 seconds for Scratch to load
  }

  // Insert share button near existing Scratch buttons
  insertShareButton(targetElement) {
    const shareButton = document.createElement('button');
    shareButton.id = 'scratch-collab-share-btn';
    shareButton.className = 'scratch-collab-share-button';
    shareButton.textContent = 'Share with ScratchCollab';
    shareButton.title = 'Share this project with friends who have ScratchCollab';

    shareButton.style.cssText = `
      background: #ff6b35;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      margin: 0 4px;
      transition: background-color 0.2s ease;
    `;

    shareButton.addEventListener('mouseenter', () => {
      shareButton.style.backgroundColor = '#e55a2b';
    });

    shareButton.addEventListener('mouseleave', () => {
      shareButton.style.backgroundColor = '#ff6b35';
    });

    shareButton.addEventListener('click', () => {
      this.handleShareButtonClick();
    });

    // Insert button after the target element
    if (targetElement.parentNode) {
      targetElement.parentNode.insertBefore(shareButton, targetElement.nextSibling);
      console.log('ScratchCollab share button added to Scratch interface');
    }
  }

  // Handle share button click
  async handleShareButtonClick() {
    const projectId = this.extractProjectId();

    if (projectId) {
      try {
        const result = await chrome.storage.local.get(['serverUrl']);
        const serverUrl = result.serverUrl;

        // Check if server URL is configured
        if (!serverUrl || serverUrl.trim() === '') {
          this.showSetupRequiredNotification();
          return;
        }

        // Generate collaboration URL using the server
        const collaborationUrl = `${serverUrl}?project=${projectId}&source=scratch`;

        // Test if server is reachable before sharing
        const serverReachable = await this.testServerAvailability(serverUrl);

        if (serverReachable) {
          // Server is available - copy link and show success message
          await this.copyCollaborationUrl(collaborationUrl);
          this.showNotification(`Zusammenarbeits-Link erstellt: ${collaborationUrl}`);
        } else {
          // Server not reachable - offer to start server or use alternative
          this.handleServerNotAvailable(collaborationUrl, serverUrl);
        }

      } catch (error) {
        console.error('Error generating collaboration URL:', error);
        this.showNotification('Fehler beim Generieren des Links');
      }
    } else {
      this.showNotification('Projekt-ID konnte nicht extrahiert werden');
    }
  }

  // Fallback copy method for older browsers
  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showNotification('Zusammenarbeits-Link in Zwischenablage kopiert!');
      } else {
        this.showNotification('Fehler beim Kopieren des Links');
      }
    } catch (err) {
      console.error('Fallback: Could not copy text: ', err);
      this.showNotification('Fehler beim Kopieren des Links');
    }

    document.body.removeChild(textArea);
  }

  // Test if server is reachable
  async testServerAvailability(serverUrl) {
    try {
      // Convert WebSocket URL to HTTP for testing
      const httpUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      const healthUrl = `${httpUrl}/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: 3000
      });

      return response.ok;
    } catch (error) {
      console.warn('Server availability test failed:', error);
      return false;
    }
  }

  // Copy collaboration URL to clipboard
  async copyCollaborationUrl(url) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        this.showNotification('Zusammenarbeits-Link in Zwischenablage kopiert!');
      } else {
        this.fallbackCopyTextToClipboard(url);
      }
    } catch (error) {
      console.error('Error copying URL:', error);
      this.fallbackCopyTextToClipboard(url);
    }
  }

  // Show notification when server setup is required
  showSetupRequiredNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(255, 193, 7, 0.9);
      color: black;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10002;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Server einrichten</div>
      <div style="margin-bottom: 8px;">Bitte richten Sie zuerst eine Server-URL in der Erweiterung ein, um den Zusammenarbeits-Link zu verwenden.</div>
      <div style="font-size: 11px; color: #666;">
        Klicken Sie auf das Erweiterungssymbol und geben Sie eine Server-URL ein.
      </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Also open popup to help user configure server
    setTimeout(() => {
      chrome.action.openPopup();
    }, 1000);
  }

  // Handle case when server is configured but not available
  handleServerNotAvailable(collaborationUrl, serverUrl) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(255, 107, 53, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10002;
      max-width: 320px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Server nicht erreichbar</div>
      <div style="margin-bottom: 8px;">Der Server ${serverUrl} ist nicht erreichbar.</div>
      <div style="margin-bottom: 8px; font-size: 11px;">
        Mögliche Lösungen:<br>
        • Starten Sie den Server: <code>cd server && npm start</code><br>
        • Überprüfen Sie die Server-URL in den Einstellungen
      </div>
      <div style="margin-top: 8px;">
        <button id="copyLinkAnyway" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
          margin-right: 8px;
        ">Trotzdem Link kopieren</button>
        <button id="openSettings" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
        ">Einstellungen öffnen</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Handle button clicks
    const copyLinkBtn = notification.querySelector('#copyLinkAnyway');
    const openSettingsBtn = notification.querySelector('#openSettings');

    copyLinkBtn.addEventListener('click', () => {
      this.copyCollaborationUrl(collaborationUrl);
      notification.remove();
    });

    openSettingsBtn.addEventListener('click', () => {
      chrome.action.openPopup();
      notification.remove();
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  updateCollaborationUI() {
    if (this.statusElement) {
      if (this.isCollaborating) {
        this.statusElement.textContent = `Collaborating as ${this.userName}`;
        this.statusElement.style.display = 'block';
        this.statusElement.style.background = 'rgba(0, 150, 0, 0.8)';
      } else {
        this.statusElement.style.display = 'none';
      }
    }
  }

  hideCollaborationStatus() {
    if (this.statusElement) {
      this.statusElement.style.display = 'none';
    }
  }

  // Handle incoming collaboration events (from other users)
  handleCollaborationEvent(event) {
    console.log('Received collaboration event:', event);

    switch (event.type) {
      case 'userJoined':
        this.showNotification(`${event.userName} joined the collaboration`);
        break;

      case 'userLeft':
        this.showNotification(`${event.userName} left the collaboration`);
        break;

      case 'projectUpdate':
        this.applyProjectUpdate(event.data);
        break;
    }
  }

  // Handle chat messages from server
  handleChatMessage(message) {
    console.log('Received chat message:', message);

    // Forward chat message to popup
    chrome.runtime.sendMessage({
      action: 'chatMessageReceived',
      userName: message.userName,
      chatMessage: message.message,
      timestamp: message.timestamp
    });
  }

  // Send chat message to server
  sendChatMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const chatMessage = {
        type: 'chatMessage',
        projectId: this.projectId,
        message: message,
        timestamp: Date.now()
      };

      this.socket.send(JSON.stringify(chatMessage));
    }
  }

  // Send friend invitation to server
  sendFriendInvitation(friendUsername) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const invitationMessage = {
        type: 'friendInvitation',
        friendUsername: friendUsername,
        projectId: this.projectId,
        hostUsername: this.userName,
        timestamp: Date.now()
      };

      this.socket.send(JSON.stringify(invitationMessage));
      console.log(`Friend invitation sent to ${friendUsername}`);
    }
  }

  // Detect Scratch website language
  detectScratchLanguage() {
    let detectedLanguage = 'en'; // Default fallback

    try {
      // Method 1: Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang && this.isValidScratchLanguage(urlLang)) {
        detectedLanguage = urlLang;
        console.log('Language detected from URL:', detectedLanguage);
        this.applyDetectedLanguage(detectedLanguage);
        return;
      }

      // Method 2: Check for Scratch language cookie
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'scratchlanguage' && this.isValidScratchLanguage(value)) {
          detectedLanguage = value;
          console.log('Language detected from cookie:', detectedLanguage);
          this.applyDetectedLanguage(detectedLanguage);
          return;
        }
      }

      // Method 3: Check for Scratch's JavaScript language variables
      if (window.scratchLang) {
        detectedLanguage = window.scratchLang;
        console.log('Language detected from scratchLang variable:', detectedLanguage);
        this.applyDetectedLanguage(detectedLanguage);
        return;
      }

      // Method 4: Check HTML lang attribute
      const htmlLang = document.documentElement.lang;
      if (htmlLang && this.isValidScratchLanguage(htmlLang)) {
        detectedLanguage = htmlLang;
        console.log('Language detected from HTML lang attribute:', detectedLanguage);
        this.applyDetectedLanguage(detectedLanguage);
        return;
      }

      // Method 5: Check for Scratch-specific language indicators in DOM
      const languageSelectors = [
        '[data-language]',
        '.language-selector',
        '#language-selector'
      ];

      for (let selector of languageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const langAttribute = element.getAttribute('data-language');
          if (langAttribute && this.isValidScratchLanguage(langAttribute)) {
            detectedLanguage = langAttribute;
            console.log('Language detected from DOM element:', detectedLanguage);
            this.applyDetectedLanguage(detectedLanguage);
            return;
          }
        }
      }

      // Method 6: Check browser language as fallback
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang) {
        const langCode = browserLang.split('-')[0]; // Get primary language code
        if (this.isValidScratchLanguage(langCode)) {
          detectedLanguage = langCode;
          console.log('Language detected from browser:', detectedLanguage);
          this.applyDetectedLanguage(detectedLanguage);
          return;
        }
      }

      // Method 7: Check Scratch's initial state or configuration
      if (window.initialReduxState && window.initialReduxState.locales) {
        const reduxLang = window.initialReduxState.locales.locale || window.initialReduxState.locales.language;
        if (reduxLang && this.isValidScratchLanguage(reduxLang)) {
          detectedLanguage = reduxLang;
          console.log('Language detected from Redux state:', detectedLanguage);
          this.applyDetectedLanguage(detectedLanguage);
          return;
        }
      }

      console.log('Using default language:', detectedLanguage);
      this.applyDetectedLanguage(detectedLanguage);

    } catch (error) {
      console.error('Error detecting Scratch language:', error);
      console.log('Using default language: en');
      this.applyDetectedLanguage('en');
    }
  }

  // Validate if language code is supported by Scratch
  isValidScratchLanguage(langCode) {
    const supportedLanguages = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'nl', 'da', 'fi',
      'nb', 'sv', 'pl', 'tr', 'ja', 'ko', 'zh-cn', 'zh-tw', 'ar', 'ca'
    ];
    return supportedLanguages.includes(langCode.toLowerCase());
  }

  // Apply detected language to extension
  applyDetectedLanguage(language) {
    console.log('Applying language to extension:', language);

    // Store detected language
    this.currentLanguage = language;

    // Send language to popup for UI updates
    chrome.runtime.sendMessage({
      action: 'languageDetected',
      language: language
    });

    // Update extension UI if needed
    this.updateUILanguage(language);
  }

  // Update UI elements to match detected language
  updateUILanguage(language) {
    // This will be implemented when we add translation support
    console.log('UI language updated to:', language);
  }

  // Detect Scratch user authentication status
  detectScratchAuth() {
    console.log('Detecting Scratch authentication status...');

    const authInfo = {
      isLoggedIn: false,
      username: null,
      userId: null,
      avatar: null,
      profileUrl: null
    };

    try {
      // Method 1: Check Scratch's Redux state for user data
      if (window.initialReduxState && window.initialReduxState.session) {
        const session = window.initialReduxState.session;
        if (session && session.user && !session.user.new_scratcher) {
          authInfo.isLoggedIn = true;
          authInfo.username = session.user.username;
          authInfo.userId = session.user.id;
          authInfo.avatar = session.user.thumbnail_url;
          authInfo.profileUrl = `https://scratch.mit.edu/users/${session.user.username}/`;
          console.log('Scratch auth detected from Redux state:', authInfo);
          this.applyScratchAuth(authInfo);
          return;
        }
      }

      // Method 2: Check for Scratch's authentication cookies
      const cookies = document.cookie.split(';');
      let foundAuthCookie = false;

      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name.includes('scratchsessionsid') || name.includes('scratchcsrftoken')) {
          foundAuthCookie = true;
        }
      }

      if (foundAuthCookie) {
        // Try to get user info from Scratch's API or page elements
        this.extractUserInfoFromPage(authInfo);
        return;
      }

      // Method 3: Check for user menu or profile elements
      const userMenuSelectors = [
        '.user-menu',
        '[data-control="user-menu"]',
        '.profile-link',
        'a[href*="/users/"]'
      ];

      for (let selector of userMenuSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const href = element.href || element.getAttribute('href');
          if (href && href.includes('/users/')) {
            const usernameMatch = href.match(/\/users\/([^\/]+)/);
            if (usernameMatch) {
              authInfo.isLoggedIn = true;
              authInfo.username = usernameMatch[1];
              authInfo.profileUrl = href;
              console.log('Scratch auth detected from user menu:', authInfo);
              this.applyScratchAuth(authInfo);
              return;
            }
          }
        }
      }

      // Method 4: Check for Scratch's JavaScript variables
      if (window.scratchConfig && window.scratchConfig.LOGGED_IN_USER) {
        const user = window.scratchConfig.LOGGED_IN_USER;
        authInfo.isLoggedIn = true;
        authInfo.username = user.username;
        authInfo.userId = user.id;
        authInfo.avatar = user.avatar;
        authInfo.profileUrl = `https://scratch.mit.edu/users/${user.username}/`;
        console.log('Scratch auth detected from scratchConfig:', authInfo);
        this.applyScratchAuth(authInfo);
        return;
      }

      console.log('No Scratch authentication detected');
      this.applyScratchAuth(authInfo);

    } catch (error) {
      console.error('Error detecting Scratch authentication:', error);
      this.applyScratchAuth(authInfo);
    }
  }

  // Extract user information from page elements
  extractUserInfoFromPage(authInfo) {
    // Look for username in various page elements
    const usernameSelectors = [
      '.username',
      '.user-name',
      '[data-user]',
      '.profile-name'
    ];

    for (let selector of usernameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('data-user');
        if (text && text.trim()) {
          authInfo.isLoggedIn = true;
          authInfo.username = text.trim();
          authInfo.profileUrl = `https://scratch.mit.edu/users/${text.trim()}/`;
          console.log('User info extracted from page:', authInfo);
          this.applyScratchAuth(authInfo);
          return;
        }
      }
    }

    // If we found auth cookies but no user info, assume logged in as anonymous
    authInfo.isLoggedIn = true;
    authInfo.username = 'Anonymous';
    console.log('Partial auth detected (cookies only):', authInfo);
    this.applyScratchAuth(authInfo);
  }

  // Apply Scratch authentication information
  applyScratchAuth(authInfo) {
    console.log('Applying Scratch authentication:', authInfo);

    // Store auth info
    this.scratchAuth = authInfo;

    // Send auth info to popup for UI updates
    chrome.runtime.sendMessage({
      action: 'scratchAuthDetected',
      authInfo: authInfo
    });

    // Update extension UI based on auth status
    this.updateUIForAuth(authInfo);
  }

  // Update UI based on authentication status
  updateUIForAuth(authInfo) {
    if (authInfo.isLoggedIn && authInfo.username) {
      console.log(`User ${authInfo.username} is logged into Scratch`);
      // Update collaboration UI to show authenticated user
      this.updateCollaborationAuth(authInfo);
    } else {
      console.log('User is not logged into Scratch');
      // Show login prompt or use anonymous mode
    }
  }

  // Update collaboration features with auth info
  updateCollaborationAuth(authInfo) {
    // If user is starting collaboration, use their Scratch username
    if (this.userName === 'Anonymous' || !this.userName) {
      this.userName = authInfo.username;
      console.log('Using Scratch username for collaboration:', this.userName);
    }
  }

  showNotification(message) {
    // Show a simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10001;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  applyProjectUpdate(message) {
    // Apply updates from other collaborators
    console.log('Applying project update from', message.userName, ':', message.data);

    // Show notification about the update
    this.showNotification(`${message.userName} made changes to the project`);

    // In a real implementation, this would:
    // 1. Parse the update data
    // 2. Apply changes to Scratch's internal project structure
    // 3. Update the visual representation

    // For now, we'll just log the update
    // TODO: Implement actual Scratch project modification
  }

  updateCursorPosition(message) {
    // Update cursor position for remote users
    console.log('Cursor update from', message.userName, ':', message.position);

    // In a real implementation, this would show remote user cursors
    // For now, we'll just show a notification
    if (message.userName !== this.userName) {
      // Only show cursor updates from other users
      // TODO: Implement visual cursor indicators
    }
  }

  // Track local cursor movements
  trackCursorMovement() {
    let lastPosition = { x: 0, y: 0 };

    document.addEventListener('mousemove', (event) => {
      if (this.isCollaborating && this.socket && this.socket.readyState === WebSocket.OPEN) {
        const currentPosition = { x: event.clientX, y: event.clientY };

        // Only send updates if position changed significantly
        if (Math.abs(currentPosition.x - lastPosition.x) > 5 ||
            Math.abs(currentPosition.y - lastPosition.y) > 5) {

          const cursorMessage = {
            type: 'cursorMove',
            projectId: this.projectId,
            position: currentPosition,
            timestamp: Date.now()
          };

          this.socket.send(JSON.stringify(cursorMessage));
          lastPosition = currentPosition;
        }
      }
    });
  }

  // Initialize cursor preview system
  initCursorPreview() {
    console.log('Initializing cursor preview system');

    // Create container for remote cursors
    this.remoteCursorsContainer = document.createElement('div');
    this.remoteCursorsContainer.id = 'scratch-collab-cursors';
    this.remoteCursorsContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      font-family: Arial, sans-serif;
      font-size: 12px;
    `;

    document.body.appendChild(this.remoteCursorsContainer);

    // Store remote cursors
    this.remoteCursors = new Map();
  }

  // Update cursor position for remote users
  updateCursorPosition(message) {
    const { userName, clientId, position } = message;

    if (userName === this.userName) {
      return; // Don't show own cursor
    }

    // Create or update remote cursor
    let cursorElement = this.remoteCursors.get(clientId);

    if (!cursorElement) {
      cursorElement = this.createRemoteCursor(userName, clientId);
      this.remoteCursors.set(clientId, cursorElement);
    }

    // Update cursor position and visibility
    cursorElement.style.left = (position.x - 10) + 'px'; // Offset for cursor size
    cursorElement.style.top = (position.y - 10) + 'px';
    cursorElement.style.display = 'block';

    // Update timestamp for cleanup
    cursorElement.dataset.lastUpdate = Date.now();

    // Hide cursor after inactivity
    setTimeout(() => {
      this.hideInactiveCursor(clientId);
    }, 5000); // Hide after 5 seconds of inactivity
  }

  // Create remote cursor element
  createRemoteCursor(userName, clientId) {
    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'remote-cursor-container';
    cursorContainer.dataset.clientId = clientId;
    cursorContainer.style.cssText = `
      position: absolute;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;

    // Create cursor visual
    const cursor = document.createElement('div');
    cursor.className = 'remote-cursor';
    cursor.style.cssText = `
      width: 20px;
      height: 20px;
      background: rgba(255, 107, 53, 0.8);
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      position: relative;
    `;

    // Create name label
    const nameLabel = document.createElement('div');
    nameLabel.className = 'remote-cursor-name';
    nameLabel.textContent = userName;
    nameLabel.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      margin-left: 10px;
      margin-top: -5px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    `;

    cursorContainer.appendChild(cursor);
    cursorContainer.appendChild(nameLabel);
    this.remoteCursorsContainer.appendChild(cursorContainer);

    return cursorContainer;
  }

  // Hide inactive cursors
  hideInactiveCursor(clientId) {
    const cursorElement = this.remoteCursors.get(clientId);
    if (cursorElement) {
      const lastUpdate = parseInt(cursorElement.dataset.lastUpdate) || 0;
      const now = Date.now();

      if (now - lastUpdate > 5000) { // 5 seconds timeout
        cursorElement.style.display = 'none';
      }
    }
  }

  // Clean up all remote cursors
  cleanupRemoteCursors() {
    if (this.remoteCursorsContainer) {
      this.remoteCursorsContainer.remove();
    }
    this.remoteCursors.clear();
  }
}

// Initialize the collaboration system
const scratchCollab = new ScratchCollaboration();
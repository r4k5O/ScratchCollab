// Popup script for Scratch Collaboration Extension

class CollaborationPopup {
  constructor() {
    this.isConnected = false;
    this.currentProject = null;
    this.userName = '';
    this.translator = null;

    this.init();
  }

  init() {
    // Get DOM elements
    this.statusElement = document.getElementById('status');
    this.connectionForm = document.getElementById('connectionForm');
    this.collaborationControls = document.getElementById('collaborationControls');
    this.serverUrlInput = document.getElementById('serverUrl');
    this.userNameInput = document.getElementById('userName');
    this.projectIdInput = document.getElementById('projectId');
    this.connectBtn = document.getElementById('connectBtn');
    this.disconnectBtn = document.getElementById('disconnectBtn');
    this.participantList = document.getElementById('participantList');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendChatBtn = document.getElementById('sendChatBtn');
    this.scratchAuthStatus = document.getElementById('scratchAuthStatus');
    this.showFriendsBtn = document.getElementById('showFriendsBtn');
    this.inviteFriendBtn = document.getElementById('inviteFriendBtn');
    this.friendsList = document.getElementById('friendsList');
    this.setupContainer = document.getElementById('setupContainer');
    this.setupServerUrl = document.getElementById('setupServerUrl');
    this.setupUserName = document.getElementById('setupUserName');
    this.completeSetupBtn = document.getElementById('completeSetupBtn');
    this.changeServerBtn = document.getElementById('changeServerBtn');
    this.startServerBtn = document.getElementById('startServerBtn');

    // Set up event listeners
    this.setupEventListeners();

    // Load current status
    this.loadCurrentStatus();

    // Set up message listener for chat messages and language changes
    this.setupMessageListener();

    // Initialize translator
    this.initializeTranslator();
  }

  setupEventListeners() {
    // Connect button
    this.connectBtn.addEventListener('click', () => {
      this.startCollaboration();
    });

    // Disconnect button
    this.disconnectBtn.addEventListener('click', () => {
      this.stopCollaboration();
    });

    // Enter key in form fields
    this.serverUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.startCollaboration();
    });

    this.userNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.startCollaboration();
    });

    // Chat functionality
    this.sendChatBtn.addEventListener('click', () => {
      this.sendChatMessage();
    });

    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendChatMessage();
      }
    });

    // Friends functionality
    this.showFriendsBtn.addEventListener('click', () => {
      this.toggleFriendsList();
    });

    this.inviteFriendBtn.addEventListener('click', () => {
      this.showInviteFriendDialog();
    });

    // Setup functionality
    this.completeSetupBtn.addEventListener('click', () => {
      this.completeSetup();
    });

    this.setupServerUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.completeSetup();
      }
    });

    this.setupUserName.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.completeSetup();
      }
    });

    // Change server functionality
    this.changeServerBtn.addEventListener('click', () => {
      this.showServerChangeDialog();
    });

    // Start server functionality
    if (this.startServerBtn) {
      this.startServerBtn.addEventListener('click', () => {
        this.startCollaborationServer();
      });
    }
  }

  async loadCurrentStatus() {
    try {
      // Check if this is first run (no settings stored)
      const result = await chrome.storage.local.get([
        'collaborationEnabled',
        'serverUrl',
        'userName',
        'currentProject',
        'setupCompleted'
      ]);

      // If setup not completed, show setup screen
      if (!result.setupCompleted) {
        this.showSetupScreen();
        return;
      }

      // Send message to background script to get current status
      const response = await this.sendMessage({
        action: 'getCollaborationStatus'
      });

      if (response.success) {
        const status = response.status;

        if (status.collaborationEnabled) {
          this.isConnected = true;
          this.userName = status.userName;
          this.currentProject = status.currentProject;
          this.serverUrlInput.value = status.serverUrl;

          this.updateUIForConnected();
        } else {
          this.updateUIForDisconnected();
        }
      }
    } catch (error) {
      console.error('Error loading status:', error);
      this.updateUIForDisconnected();
    }
  }

  showSetupScreen() {
    // Hide other containers
    this.statusElement.style.display = 'none';
    this.connectionForm.style.display = 'none';
    this.collaborationControls.style.display = 'none';

    // Show setup container
    this.setupContainer.style.display = 'block';

    // Pre-fill with default values
    this.setupServerUrl.value = 'http://localhost:3000';
    this.setupUserName.value = 'Anonymous';
  }

  async completeSetup() {
    const serverUrl = this.setupServerUrl.value.trim();
    const userName = this.setupUserName.value.trim();

    if (!serverUrl || !userName) {
      this.showError('Bitte füllen Sie alle Felder aus');
      return;
    }

    if (!this.isValidServerUrl(serverUrl)) {
      this.showError('Bitte geben Sie eine gültige Server-URL ein');
      return;
    }

    try {
      // Save setup as completed
      await chrome.storage.local.set({
        serverUrl: serverUrl,
        userName: userName,
        setupCompleted: true
      });

      // Test server availability
      const serverAvailable = await this.testServerAvailability(serverUrl);

      if (serverAvailable) {
        this.showNotification('Setup erfolgreich abgeschlossen!');

        // Hide setup and show normal interface
        this.setupContainer.style.display = 'none';
        this.statusElement.style.display = 'block';
        this.connectionForm.style.display = 'block';

        // Pre-fill connection form
        this.serverUrlInput.value = serverUrl;
        this.userNameInput.value = userName;
      } else {
        this.showError('Server ist nicht erreichbar. Bitte überprüfen Sie die URL oder starten Sie den Server.');
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      this.showError('Fehler beim Setup. Bitte versuchen Sie es erneut.');
    }
  }

  async testServerAvailability(serverUrl) {
    try {
      // Test if server is reachable by making a request to the health endpoint
      const response = await fetch(`${serverUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/health`, {
        method: 'GET',
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      console.warn('Server availability test failed:', error);
      return false;
    }
  }

  async startCollaboration() {
    const serverUrl = this.serverUrlInput.value.trim();
    const userName = this.userNameInput.value.trim();

    if (!serverUrl || !userName) {
      this.showError('Bitte geben Sie sowohl die Server-URL als auch Ihren Namen ein');
      return;
    }

    // Validate server URL format
    if (!this.isValidServerUrl(serverUrl)) {
      this.showError('Bitte geben Sie eine gültige Server-URL ein (z.B. http://localhost:3000 oder https://abc123.ngrok.io)');
      return;
    }

    // Disable connect button
    this.connectBtn.disabled = true;
    this.connectBtn.textContent = 'Connecting...';

    try {
      // Save settings
      await this.saveSettings(serverUrl, userName);

      // Get current tab to extract project ID
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length === 0) {
        throw new Error('Please open a Scratch project page first');
      }

      const currentTab = tabs[0];
      const projectIdMatch = currentTab.url.match(/\/projects\/(\d+)/);

      if (!projectIdMatch) {
        throw new Error('Could not extract project ID from current page');
      }

      const projectId = projectIdMatch[1];

      // Send start collaboration message to background script
      const response = await this.sendMessage({
        action: 'startCollaboration',
        projectId: projectId,
        userName: userName
      });

      if (response.success) {
        this.isConnected = true;
        this.userName = userName;
        this.currentProject = projectId;

        this.updateUIForConnected();

        // Update current project input
        this.projectIdInput.value = projectId;
      } else {
        throw new Error(response.error || 'Failed to start collaboration');
      }
    } catch (error) {
      console.error('Error starting collaboration:', error);
      this.showError(error.message);
      this.connectBtn.disabled = false;
      this.connectBtn.textContent = 'Start Collaboration';
    }

    // Set timeout to reset connection if it gets stuck
    setTimeout(() => {
      if (this.connectBtn.disabled && this.connectBtn.textContent === 'Connecting...') {
        console.log('Connection timeout - resetting');
        this.showError('Connection timeout - please try again');
        this.connectBtn.disabled = false;
        this.connectBtn.textContent = 'Start Collaboration';
      }
    }, 15000); // 15 second timeout
  }

  async stopCollaboration() {
    try {
      this.disconnectBtn.disabled = true;
      this.disconnectBtn.textContent = 'Disconnecting...';

      const response = await this.sendMessage({
        action: 'stopCollaboration'
      });

      if (response.success) {
        this.isConnected = false;
        this.currentProject = null;

        this.updateUIForDisconnected();
      } else {
        throw new Error(response.error || 'Failed to stop collaboration');
      }
    } catch (error) {
      console.error('Error stopping collaboration:', error);
      this.showError(error.message);
      this.disconnectBtn.disabled = false;
      this.disconnectBtn.textContent = 'Stop Collaboration';
    }
  }

  updateUIForConnected() {
    this.statusElement.textContent = `Connected as ${this.userName}`;
    this.statusElement.className = 'status connected';

    this.connectionForm.style.display = 'none';
    this.collaborationControls.style.display = 'block';

    this.connectBtn.disabled = false;
    this.connectBtn.textContent = 'Start Collaboration';
    this.disconnectBtn.disabled = false;
    this.disconnectBtn.textContent = 'Stop Collaboration';

    // Update participants (placeholder for now)
    this.updateParticipants();
  }

  updateUIForDisconnected() {
    this.statusElement.textContent = 'Not connected';
    this.statusElement.className = 'status disconnected';

    this.connectionForm.style.display = 'block';
    this.collaborationControls.style.display = 'none';

    this.disconnectBtn.disabled = false;
    this.disconnectBtn.textContent = 'Stop Collaboration';

    // Clear participants
    this.participantList.innerHTML = '';
  }

  updateParticipants() {
    // Show current user first
    let participantsHtml = `
      <div class="participant">
        <div class="participant-dot online"></div>
        <span>${this.userName} (You)</span>
      </div>
    `;

    // Add other participants if available
    if (this.participants && this.participants.length > 0) {
      this.participants.forEach(participant => {
        if (participant.userName !== this.userName) {
          const avatarHtml = participant.profile && participant.profile.avatar
            ? `<img src="${participant.profile.avatar}" alt="${participant.userName}" class="scratch-avatar">`
            : '';

          const profileLinkHtml = participant.profile && participant.profile.profileUrl
            ? `<a href="${participant.profile.profileUrl}" target="_blank" class="scratch-profile-link">Profile</a>`
            : '';

          participantsHtml += `
            <div class="participant">
              <div class="participant-dot ${participant.isAuthenticated ? 'online' : 'offline'}"></div>
              <div class="participant-info">
                ${avatarHtml}
                <span>${participant.userName}</span>
                ${profileLinkHtml ? ` (${profileLinkHtml})` : ''}
              </div>
            </div>
          `;
        }
      });
    }

    this.participantList.innerHTML = participantsHtml;
  }

  updateParticipantsList(participants) {
    console.log('Updating participants list:', participants);
    this.participants = participants;
    this.updateParticipants();
  }

  async saveSettings(serverUrl, userName) {
    try {
      await chrome.storage.local.set({
        serverUrl: serverUrl,
        userName: userName
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  showError(message) {
    // Show error message in status area temporarily
    const originalText = this.statusElement.textContent;
    const originalClass = this.statusElement.className;

    this.statusElement.textContent = `Error: ${message}`;
    this.statusElement.className = 'status disconnected';

    setTimeout(() => {
      this.statusElement.textContent = originalText;
      this.statusElement.className = originalClass;
    }, 3000);
  }

  sendChatMessage() {
    const message = this.chatInput.value.trim();

    if (!message || !this.isConnected) {
      return;
    }

    // Send chat message through content script to server
    chrome.tabs.query({ url: 'https://scratch.mit.edu/projects/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'sendChatMessage',
          message: message
        });
      });
    });

    // Clear input
    this.chatInput.value = '';
  }

  addChatMessage(userName, message, isOwnMessage = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isOwnMessage ? 'own-message' : ''}`;

    const headerElement = document.createElement('div');
    headerElement.className = 'chat-message-header';
    headerElement.textContent = userName;

    const textElement = document.createElement('div');
    textElement.className = 'chat-message-text';
    textElement.textContent = message;

    messageElement.appendChild(headerElement);
    messageElement.appendChild(textElement);

    this.chatMessages.appendChild(messageElement);

    // Auto-scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  clearChat() {
    this.chatMessages.innerHTML = '';
  }

  handleScratchAuth(authInfo) {
    console.log('Handling Scratch auth in popup:', authInfo);
    this.scratchAuth = authInfo;
    this.updateScratchAuthDisplay(authInfo);

    // If user is logged in and we don't have a username set, use their Scratch username
    if (authInfo.isLoggedIn && authInfo.username && (!this.userName || this.userName === 'Anonymous')) {
      this.userName = authInfo.username;
      if (this.userNameInput) {
        this.userNameInput.value = this.userName;
      }
      console.log('Using Scratch username for collaboration:', this.userName);
    }
  }

  updateScratchAuthDisplay(authInfo) {
    if (!this.scratchAuthStatus) return;

    if (authInfo.isLoggedIn && authInfo.username) {
      // User is logged in - show profile info
      this.scratchAuthStatus.innerHTML = `
        <div class="scratch-auth-logged-in">
          <div class="scratch-user-info">
            ${authInfo.avatar ? `<img src="${authInfo.avatar}" alt="${authInfo.username}" class="scratch-avatar">` : ''}
            <div>
              <div class="scratch-username">${authInfo.username}</div>
              ${authInfo.profileUrl ? `<a href="${authInfo.profileUrl}" target="_blank" class="scratch-profile-link">View Profile</a>` : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      // User is not logged in - show login prompt
      this.scratchAuthStatus.innerHTML = `
        <div class="scratch-auth-logged-out">
          <div class="scratch-login-prompt">
            <div>Not logged into Scratch</div>
            <a href="https://scratch.mit.edu/login" target="_blank" class="scratch-login-btn">Login to Scratch</a>
          </div>
        </div>
      `;
    }
  }

  openScratchLogin() {
    // Open Scratch login page in new tab
    chrome.tabs.create({
      url: 'https://scratch.mit.edu/login',
      active: true
    });
  }

  toggleFriendsList() {
    const isVisible = this.friendsList.style.display !== 'none';
    this.friendsList.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      this.loadFriendsList();
    }
  }

  async loadFriendsList() {
    try {
      // For now, we'll simulate a friends list
      // In a real implementation, this would fetch from the server
      const mockFriends = [
        {
          id: 1,
          username: 'friend1',
          avatar: null,
          isOnline: true,
          status: 'online'
        },
        {
          id: 2,
          username: 'friend2',
          avatar: null,
          isOnline: false,
          status: 'offline'
        }
      ];

      this.displayFriendsList(mockFriends);
    } catch (error) {
      console.error('Error loading friends list:', error);
    }
  }

  displayFriendsList(friends) {
    if (!friends || friends.length === 0) {
      this.friendsList.innerHTML = '<div class="friend-item"><div>No friends yet</div></div>';
      return;
    }

    const friendsHtml = friends.map(friend => `
      <div class="friend-item">
        <img src="${friend.avatar || '/images/avatar-default.png'}"
             alt="${friend.username}"
             class="friend-avatar"
             onerror="this.src='/images/avatar-default.png'">
        <div class="friend-info">
          <div class="friend-name">${friend.username}</div>
          <div style="font-size: 10px; color: #666;">
            ${friend.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div class="friend-actions">
          <button class="friend-btn primary"
                  onclick="window.collaborationPopup.inviteFriendToCollaborate('${friend.username}')">
            Invite
          </button>
        </div>
      </div>
    `).join('');

    this.friendsList.innerHTML = friendsHtml;
  }

  showInviteFriendDialog() {
    // For now, show a simple prompt
    // In a real implementation, this would show a proper dialog
    const friendUsername = prompt('Enter your friend\'s Scratch username:');
    if (friendUsername && friendUsername.trim()) {
      this.sendFriendInvitation(friendUsername.trim());
    }
  }

  async sendFriendInvitation(friendUsername) {
    try {
      // Send friend invitation through content script to server
      chrome.tabs.query({ url: 'https://scratch.mit.edu/projects/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'sendFriendInvitation',
            friendUsername: friendUsername
          });
        });
      });

      this.showNotification(`Friend invitation sent to ${friendUsername}`);
    } catch (error) {
      console.error('Error sending friend invitation:', error);
      this.showNotification('Failed to send friend invitation');
    }
  }

  inviteFriendToCollaborate(friendUsername) {
    // Invite friend to current collaboration session
    if (this.currentProject) {
      this.sendFriendInvitation(friendUsername);
    } else {
      this.showNotification('Please start a collaboration session first');
    }
  }

  showNotification(message) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10001;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Validate server URL format (supports ngrok and other tunneling services)
  isValidServerUrl(url) {
    try {
      const urlObj = new URL(url);

      // Allow HTTP and HTTPS
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }

      // Allow common development and tunneling domains
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '.ngrok.io',
        '.ngrok.com',
        '.ngrok-free.app',
        'localhost.run',
        '.serveo.net',
        '.localtunnel.me',
        '.tunnelmole.com'
      ];

      const hostname = urlObj.hostname.toLowerCase();

      // Allow exact matches (localhost, 127.0.0.1, etc.)
      if (allowedDomains.includes(hostname)) {
        return true;
      }

      // Allow wildcard matches (*.ngrok.io, etc.)
      const isAllowedWildcard = allowedDomains.some(domain => {
        if (domain.startsWith('.')) {
          return hostname.endsWith(domain);
        }
        return false;
      });

      return isAllowedWildcard;
    } catch (error) {
      return false;
    }
  }

  // Reset setup (for testing or if server becomes unavailable)
  async resetSetup() {
    try {
      await chrome.storage.local.set({
        setupCompleted: false
      });

      this.showSetupScreen();
    } catch (error) {
      console.error('Error resetting setup:', error);
    }
  }

  // Show server change dialog
  showServerChangeDialog() {
    const newServerUrl = prompt('Geben Sie die neue Server-URL ein:', this.serverUrlInput.value);

    if (newServerUrl && newServerUrl.trim()) {
      if (this.isValidServerUrl(newServerUrl.trim())) {
        // Update server URL
        this.serverUrlInput.value = newServerUrl.trim();

        // Save to storage
        chrome.storage.local.set({
          serverUrl: newServerUrl.trim()
        });

        this.showNotification('Server-URL wurde aktualisiert');

        // Test new server if currently collaborating
        if (this.isConnected) {
          this.showNotification('Bitte starten Sie die Zusammenarbeit neu mit der neuen Server-URL');
        }
      } else {
        this.showError('Bitte geben Sie eine gültige Server-URL ein (z.B. http://localhost:3000 oder https://abc123.ngrok.io)');
      }
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'displayChatMessage':
          this.addChatMessage(request.userName, request.message);
          sendResponse({ success: true });
          break;

        case 'participantsListUpdated':
          this.updateParticipantsList(request.participants);
          sendResponse({ success: true });
          break;

        case 'languageDetected':
          this.handleLanguageDetection(request.language);
          sendResponse({ success: true });
          break;

        case 'languageChanged':
          this.updateUILanguage(request.language);
          sendResponse({ success: true });
          break;

        case 'scratchAuthDetected':
          this.handleScratchAuth(request.authInfo);
          sendResponse({ success: true });
          break;
      }
      return true;
    });
  }

  async initializeTranslator() {
    try {
      // Load translator script if not already loaded
      if (typeof window.translator === 'undefined') {
        // In a real implementation, you would load the translator script
        // For now, we'll use a simple translation approach
        console.log('Translator will be initialized when available');
      }

      // Listen for language change events
      document.addEventListener('scratchCollabLanguageChange', (event) => {
        this.updateUILanguage(event.detail.language);
      });

    } catch (error) {
      console.error('Error initializing translator:', error);
    }
  }

  handleLanguageDetection(language) {
    console.log('Language detected:', language);
    this.currentLanguage = language;
    this.updateUILanguage(language);
  }

  updateUILanguage(language) {
    if (!this.translator) {
      // Simple translation fallback
      this.updateUIWithLanguage(language);
    } else {
      // Use translator for full translation support
      this.updateUIWithTranslator(language);
    }
  }

  updateUIWithLanguage(language) {
    // Simple language-based UI updates
    // This is a basic implementation - in a full version you'd use proper translations

    const translations = {
      'de': {
        'startCollaboration': 'Zusammenarbeit starten',
        'stopCollaboration': 'Zusammenarbeit stoppen',
        'serverUrl': 'Server-URL:',
        'yourName': 'Ihr Name:',
        'participants': 'Teilnehmer',
        'chat': 'Chat',
        'typeMessage': 'Nachricht eingeben...',
        'send': 'Senden'
      },
      'en': {
        'startCollaboration': 'Start Collaboration',
        'stopCollaboration': 'Stop Collaboration',
        'serverUrl': 'Server URL:',
        'yourName': 'Your Name:',
        'participants': 'Participants',
        'chat': 'Chat',
        'typeMessage': 'Type a message...',
        'send': 'Send'
      }
    };

    const langTranslations = translations[language] || translations['en'];

    // Update UI elements if they exist
    if (this.connectBtn) {
      this.connectBtn.textContent = langTranslations.startCollaboration;
    }
    if (this.disconnectBtn) {
      this.disconnectBtn.textContent = langTranslations.stopCollaboration;
    }
    if (this.serverUrlInput && this.serverUrlInput.placeholder) {
      // Update placeholder would require recreating the element
      console.log('Would update server URL placeholder');
    }
    if (this.userNameInput && this.userNameInput.placeholder) {
      // Update placeholder would require recreating the element
      console.log('Would update user name placeholder');
    }
    if (this.chatInput && this.chatInput.placeholder) {
      this.chatInput.placeholder = langTranslations.typeMessage;
    }
    if (this.sendChatBtn) {
      this.sendChatBtn.textContent = langTranslations.send;
    }

    console.log(`UI language updated to: ${language}`);
  }

  // Start the collaboration server
  async startCollaborationServer() {
    try {
      this.showNotification('Starte Collaboration Server...');

      // Send message to background script to start server
      const response = await this.sendMessage({
        action: 'startServer'
      });

      if (response.success) {
        this.showNotification('Server erfolgreich gestartet!');

        // Update server URL if it was localhost
        if (this.serverUrlInput.value === 'http://localhost:3000' || !this.serverUrlInput.value) {
          this.serverUrlInput.value = 'http://localhost:3000';
          await this.saveSettings('http://localhost:3000', this.userNameInput.value);
        }

        // Test server availability
        setTimeout(async () => {
          const serverAvailable = await this.testServerAvailability('http://localhost:3000');
          if (serverAvailable) {
            this.showNotification('Server ist bereit für Zusammenarbeit!');
          } else {
            this.showNotification('Server läuft, aber ist noch nicht erreichbar. Bitte warten Sie einen Moment.');
          }
        }, 2000);

      } else {
        throw new Error(response.error || 'Failed to start server');
      }
    } catch (error) {
      console.error('Error starting server:', error);
      this.showNotification(`Fehler beim Starten des Servers: ${error.message}`);

      // Show manual start instructions
      this.showManualServerStartInstructions();
    }
  }

  // Show manual server start instructions
  showManualServerStartInstructions() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      z-index: 10002;
      max-width: 400px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Server manuell starten:</div>
      <div style="margin-bottom: 8px; line-height: 1.4;">
        Öffnen Sie ein Terminal und führen Sie aus:<br><br>
        <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 2px;">cd server</code><br>
        <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 2px;">npm start</code>
      </div>
      <div style="font-size: 10px; color: #ccc;">
        Oder verwenden Sie: <code style="background: rgba(255,255,255,0.1); padding: 1px 3px; border-radius: 2px;">npm run start:server</code>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  // Helper method to send messages to background script
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.collaborationPopup = new CollaborationPopup();
});
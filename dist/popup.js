// Popup script for Scratch Collaboration Extension

class CollaborationPopup {
  constructor() {
    this.isConnected = false;
    this.currentProject = null;
    this.userName = '';
    this.translator = null;
    this.animationsEnabled = true;

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
    this.chatCharCount = document.getElementById('chatCharCount');
    this.scratchAuthStatus = document.getElementById('scratchAuthStatus');
    this.showFriendsBtn = document.getElementById('showFriendsBtn');
    this.inviteFriendBtn = document.getElementById('inviteFriendBtn');
    this.friendsList = document.getElementById('friendsList');

    // Notification elements
    this.notificationsTabBtn = document.getElementById('notificationsTabBtn');
    this.friendsTabBtn = document.getElementById('friendsTabBtn');
    this.friendsTab = document.getElementById('friendsTab');
    this.notificationsTab = document.getElementById('notificationsTab');
    this.notificationsList = document.getElementById('notificationsList');
    this.notificationBadge = document.getElementById('notificationBadge');
    this.markAllReadBtn = document.getElementById('markAllReadBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');
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

    // Auto-detect current project ID
    this.detectCurrentProject();

    // Initialize chat counter
    this.updateChatCounter();

    // Set up message listener for chat messages and language changes
    this.setupMessageListener();

    // Initialize translator
    this.initializeTranslator();

    // Initialize animation system
    this.initializeAnimations();
  }

  // Animation utility methods
  initializeAnimations() {
    // Add CSS for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.animationsEnabled = false;
      document.body.classList.add('reduce-motion');
    }

    // Listen for motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.animationsEnabled = !e.matches;
      if (e.matches) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    });
  }

  // Add animation class with optional delay
  addAnimation(element, animationClass, delay = 0) {
    if (!this.animationsEnabled || !element) return;

    setTimeout(() => {
      element.classList.add(animationClass);
    }, delay);
  }

  // Remove animation class after animation completes
  removeAnimation(element, animationClass, duration = 300) {
    if (!element) return;

    setTimeout(() => {
      element.classList.remove(animationClass);
    }, duration);
  }

  // Animate element entrance
  animateEntrance(element, animationType = 'slide-in-bottom', delay = 0) {
    if (!this.animationsEnabled || !element) return;

    const animationClass = `animate-${animationType}`;
    this.addAnimation(element, animationClass, delay);
  }

  // Animate button loading state
  setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  // Animate status change
  animateStatusChange(statusElement, newStatus, newText) {
    if (!statusElement) return;

    const oldStatus = statusElement.className;
    const oldText = statusElement.textContent;

    // Add transition class
    statusElement.classList.add('animate-fade-in');
    statusElement.className = `status ${newStatus}`;
    statusElement.textContent = newText;

    // Add pulse animation for important changes
    if (newStatus === 'connected') {
      this.addAnimation(statusElement, 'animate-bounce-in');
    } else if (newStatus === 'disconnected') {
      this.addAnimation(statusElement, 'animate-pulse');
    }
  }

  // Animate tab switching
  switchTabWithAnimation(tabName) {
    const activeTab = document.querySelector('.tab-content.active');
    const targetTab = document.getElementById(`${tabName}Tab`);
    const targetBtn = document.getElementById(`${tabName}TabBtn`);

    if (!targetTab || !targetBtn) return;

    // Add switching animation class
    if (activeTab) {
      activeTab.classList.add('switching');
    }

    // Update tab states
    this.friendsTabBtn.classList.remove('active');
    this.notificationsTabBtn.classList.remove('active');
    this.friendsTab.classList.remove('active');
    this.notificationsTab.classList.remove('active');

    if (tabName === 'friends') {
      this.friendsTabBtn.classList.add('active');
      this.friendsTab.classList.add('active');
      this.addAnimation(this.friendsTab, 'animate-fade-in');
    } else if (tabName === 'notifications') {
      this.notificationsTabBtn.classList.add('active');
      this.notificationsTab.classList.add('active');
      this.addAnimation(this.notificationsTab, 'animate-fade-in');
      this.loadNotifications(); // Load notifications when switching to tab
    }
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

    this.chatInput.addEventListener('input', () => {
      this.updateChatCounter();
    });

    // Friends functionality
    this.showFriendsBtn.addEventListener('click', () => {
      this.toggleFriendsList();
    });

    this.inviteFriendBtn.addEventListener('click', () => {
      this.showInviteFriendDialog();
    });

    this.showRequestsBtn = document.getElementById('showRequestsBtn');
    if (this.showRequestsBtn) {
      this.showRequestsBtn.addEventListener('click', () => {
        this.showFriendRequests();
      });
    }

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

    // Tab switching
    this.friendsTabBtn.addEventListener('click', () => {
      this.switchTab('friends');
    });

    this.notificationsTabBtn.addEventListener('click', () => {
      this.switchTab('notifications');
    });

    // Notification management
    if (this.markAllReadBtn) {
      this.markAllReadBtn.addEventListener('click', () => {
        this.markAllNotificationsAsRead();
      });
    }

    if (this.clearAllBtn) {
      this.clearAllBtn.addEventListener('click', () => {
        this.clearAllNotifications();
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

      console.log('Loaded storage data:', result);

      // If setup not completed, show setup screen
      if (!result.setupCompleted) {
        this.showSetupScreen();
        return;
      }

      // Send message to background script to get current status
      // Add timeout to prevent hanging if background script is not responding
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Background script timeout')), 5000);
      });

      const messagePromise = this.sendMessage({
        action: 'getCollaborationStatus'
      });

      const response = await Promise.race([messagePromise, timeoutPromise]);

      if (response.success) {
        const status = response.status;
        console.log('Background status:', status);

        if (status.collaborationEnabled) {
          this.isConnected = true;
          // Use storage username if available, fallback to status username
          this.userName = result.userName || status.userName || 'Anonymous';
          this.currentProject = status.currentProject;
          this.serverUrlInput.value = status.serverUrl || result.serverUrl;

          console.log('Setting username to:', this.userName);
          this.updateUIForConnected();
        } else {
          this.updateUIForDisconnected();
        }
      }
    } catch (error) {
      console.error('Error loading status:', error);

      // If it's a connection error, try again after a short delay
      if (error.message && error.message.includes('Could not establish connection')) {
        console.log('Connection failed, retrying in 2 seconds...');
        setTimeout(() => {
          this.loadCurrentStatus();
        }, 2000);
        return;
      }

      this.updateUIForDisconnected();
    }
  }

  // Auto-detect and populate project ID from current Scratch tab
  async detectCurrentProject() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        const currentTab = tabs[0];
        const projectIdMatch = currentTab.url.match(/\/projects\/(\d+)/);

        if (projectIdMatch && this.projectIdInput) {
          const projectId = projectIdMatch[1];
          this.projectIdInput.value = projectId;
          this.projectIdInput.title = `Detected from: ${currentTab.url}`;
          console.log('Project ID auto-detected:', projectId);
        }
      }
    } catch (error) {
      console.warn('Could not detect project ID:', error);
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
    console.log('Complete setup button clicked');

    const serverUrl = this.setupServerUrl ? this.setupServerUrl.value.trim() : '';
    const userName = this.setupUserName ? this.setupUserName.value.trim() : '';

    console.log('Server URL:', serverUrl);
    console.log('Username:', userName);

    if (!serverUrl || !userName) {
      console.error('Missing fields');
      this.showError('Bitte füllen Sie alle Felder aus');
      return;
    }

    // Skip URL validation for now - user knows their URL is correct
    console.log('Skipping URL validation for ngrok compatibility');

    try {
      console.log('Saving settings...');
      // Save setup as completed
      await chrome.storage.local.set({
        serverUrl: serverUrl,
        userName: userName,
        setupCompleted: true
      });

      console.log('Settings saved, updating UI...');
      // Skip server availability test for now - assume it's available if URL is valid
      this.showNotification('Setup erfolgreich abgeschlossen!');

      // Hide setup and show normal interface
      if (this.setupContainer) this.setupContainer.style.display = 'none';
      if (this.statusElement) this.statusElement.style.display = 'block';
      if (this.connectionForm) this.connectionForm.style.display = 'block';

      // Pre-fill connection form
      if (this.serverUrlInput) this.serverUrlInput.value = serverUrl;
      if (this.userNameInput) this.userNameInput.value = userName;

      console.log('Setup completed successfully');

    } catch (error) {
      console.error('Error completing setup:', error);
      this.showError('Fehler beim Setup. Bitte versuchen Sie es erneut.');
    }
  }

  async testServerAvailability(serverUrl) {
    try {
      // Test if server is reachable by making a basic request
      const testUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');

      // Try health endpoint first, fall back to root if not available
      let response = await fetch(`${testUrl}/health`, {
        method: 'GET',
        mode: 'no-cors' // Allow cross-origin requests
      }).catch(() => null);

      if (!response) {
        // If health endpoint fails, try root endpoint
        response = await fetch(testUrl, {
          method: 'GET',
          mode: 'no-cors'
        }).catch(() => null);
      }

      // Consider server available if we can make any request (even with CORS errors)
      return response !== null;
    } catch (error) {
      console.warn('Server availability test failed:', error);
      // For ngrok and similar services, assume server is available if URL is valid
      return this.isValidServerUrl(serverUrl);
    }
  }

  async startCollaboration() {
    const serverUrl = this.serverUrlInput.value.trim();
    const userName = this.userNameInput.value.trim();

    if (!serverUrl || !userName) {
      this.showError('Bitte geben Sie sowohl die Server-URL als auch Ihren Namen ein');
      return;
    }

    // Skip URL validation for ngrok compatibility
    console.log('Skipping URL validation for ngrok compatibility');

    // Set loading state with animation
    this.setButtonLoading(this.connectBtn, true);
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

        // Add success animation before updating UI
        this.animateStatusChange(this.statusElement, 'connected', `Connecting as ${userName}...`);

        setTimeout(() => {
          this.updateUIForConnected();
          this.showNotification('Successfully connected to collaboration!');

          // Update current project input
          this.projectIdInput.value = projectId;
        }, 500);
      } else {
        throw new Error(response.error || 'Failed to start collaboration');
      }
    } catch (error) {
      console.error('Error starting collaboration:', error);
      this.showError(error.message);

      // Reset button state with error animation
      this.setButtonLoading(this.connectBtn, false);
      this.connectBtn.textContent = 'Start Collaboration';

      // Add shake animation for error
      this.connectBtn.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        this.connectBtn.style.animation = '';
      }, 500);
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
      // Set loading state with animation
      this.setButtonLoading(this.disconnectBtn, true);
      this.disconnectBtn.textContent = 'Disconnecting...';

      // Add disconnecting animation to status
      this.animateStatusChange(this.statusElement, 'disconnected', 'Disconnecting...');

      const response = await this.sendMessage({
        action: 'stopCollaboration'
      });

      if (response.success) {
        this.isConnected = false;
        this.currentProject = null;

        setTimeout(() => {
          this.updateUIForDisconnected();
          this.showNotification('Disconnected from collaboration');
        }, 300);
      } else {
        throw new Error(response.error || 'Failed to stop collaboration');
      }
    } catch (error) {
      console.error('Error stopping collaboration:', error);
      this.showError(error.message);

      // Reset button state with error animation
      this.setButtonLoading(this.disconnectBtn, false);
      this.disconnectBtn.textContent = 'Stop Collaboration';

      // Add shake animation for error
      this.disconnectBtn.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        this.disconnectBtn.style.animation = '';
      }, 500);
    }
  }

  updateUIForConnected() {
    // Animate status change
    this.animateStatusChange(this.statusElement, 'connected', `Connected as ${this.userName}`);

    // Animate form transitions
    if (this.connectionForm) {
      this.connectionForm.style.animation = 'slideInFromTop 0.4s ease-out reverse';
      setTimeout(() => {
        this.connectionForm.style.display = 'none';
      }, 350);
    }

    if (this.collaborationControls) {
      this.collaborationControls.style.display = 'block';
      this.animateEntrance(this.collaborationControls, 'slide-in-bottom', 100);
    }

    // Reset button states with animation
    this.setButtonLoading(this.connectBtn, false);
    this.connectBtn.textContent = 'Start Collaboration';

    this.setButtonLoading(this.disconnectBtn, false);
    this.disconnectBtn.textContent = 'Stop Collaboration';

    // Update participants with animation
    setTimeout(() => {
      this.updateParticipants();
    }, 200);
  }

  updateUIForDisconnected() {
    // Animate status change
    this.animateStatusChange(this.statusElement, 'disconnected', 'Not connected');

    // Animate form transitions
    if (this.collaborationControls) {
      this.collaborationControls.style.animation = 'slideInFromBottom 0.4s ease-out reverse';
      setTimeout(() => {
        this.collaborationControls.style.display = 'none';
      }, 350);
    }

    if (this.connectionForm) {
      this.connectionForm.style.display = 'block';
      this.animateEntrance(this.connectionForm, 'slide-in-top', 100);
    }

    // Reset button states
    this.setButtonLoading(this.disconnectBtn, false);
    this.disconnectBtn.textContent = 'Stop Collaboration';

    // Clear participants with fade out animation
    if (this.participantList) {
      const participants = this.participantList.querySelectorAll('.participant');
      participants.forEach((participant, index) => {
        setTimeout(() => {
          participant.style.animation = 'fadeIn 0.3s ease-out reverse';
          setTimeout(() => {
            participant.remove();
          }, 300);
        }, index * 50);
      });
    }
  }

  updateParticipants() {
    // Clear existing participants with fade out
    if (this.participantList) {
      const existingParticipants = this.participantList.querySelectorAll('.participant');
      existingParticipants.forEach((participant, index) => {
        setTimeout(() => {
          participant.style.animation = 'slideInFromLeft 0.3s ease-out reverse';
          setTimeout(() => {
            participant.remove();
          }, 250);
        }, index * 30);
      });
    }

    // Add current user first with animation
    setTimeout(() => {
      const userParticipant = document.createElement('div');
      userParticipant.className = 'participant';
      userParticipant.innerHTML = `
        <div class="participant-dot online"></div>
        <span>${this.userName} (You)</span>
      `;

      if (this.participantList) {
        this.participantList.appendChild(userParticipant);
        this.animateEntrance(userParticipant, 'slide-in-left', 100);
      }
    }, 150);

    // Add other participants if available with staggered animation
    if (this.participants && this.participants.length > 0) {
      this.participants.forEach((participant, index) => {
        if (participant.userName !== this.userName) {
          setTimeout(() => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant';

            const avatarHtml = participant.profile && participant.profile.avatar
              ? `<img src="${participant.profile.avatar}" alt="${participant.userName}" class="scratch-avatar">`
              : '';

            const profileLinkHtml = participant.profile && participant.profile.profileUrl
              ? `<a href="${participant.profile.profileUrl}" target="_blank" class="scratch-profile-link">Profile</a>`
              : '';

            participantElement.innerHTML = `
              <div class="participant-dot ${participant.isAuthenticated ? 'online' : 'offline'}"></div>
              <div class="participant-info">
                ${avatarHtml}
                <span>${participant.userName}</span>
                ${profileLinkHtml ? ` (${profileLinkHtml})` : ''}
              </div>
            `;

            if (this.participantList) {
              this.participantList.appendChild(participantElement);
              this.animateEntrance(participantElement, 'slide-in-left', 100);
            }
          }, 200 + (index * 100));
        }
      });
    }
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

  async sendChatMessage() {
    const message = this.chatInput.value.trim();

    if (!message || !this.isConnected) {
      return;
    }

    // Validate message length (max 500 characters)
    if (message.length > 500) {
      this.showError('Nachricht zu lang (max. 500 Zeichen)');
      return;
    }

    try {
      // Send chat message through content script to server
      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'sendChatMessage',
          message: message
        }, (response) => {
          if (response && response.success) {
            // Message sent successfully - it will be echoed back and displayed
            console.log('Chat message sent successfully');
          } else {
            this.showError(response?.error || 'Fehler beim Senden der Nachricht');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt zum Chatten');
      }

      // Clear input immediately for better UX
      this.chatInput.value = '';
      this.updateChatCounter();
    } catch (error) {
      console.error('Error sending chat message:', error);
      this.showError('Fehler beim Senden der Nachricht');
    }
  }

  updateChatCounter() {
    if (!this.chatCharCount) return;

    const length = this.chatInput.value.length;
    this.chatCharCount.textContent = length;

    // Update styling based on length
    const counterElement = this.chatCharCount.parentElement;
    counterElement.classList.remove('warning', 'error');

    if (length > 450) {
      counterElement.classList.add('error');
    } else if (length > 400) {
      counterElement.classList.add('warning');
    }
  }

  addChatMessage(userName, message, isOwnMessage = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isOwnMessage ? 'own-message' : ''}`;
    messageElement.style.opacity = '0';
    messageElement.style.transform = isOwnMessage ? 'translateY(-20px)' : 'translateY(20px)';

    const headerElement = document.createElement('div');
    headerElement.className = 'chat-message-header';
    headerElement.textContent = isOwnMessage ? `${userName} (Sie)` : userName;

    const textElement = document.createElement('div');
    textElement.className = 'chat-message-text';
    textElement.textContent = message;

    messageElement.appendChild(headerElement);
    messageElement.appendChild(textElement);

    this.chatMessages.appendChild(messageElement);

    // Animate message entrance
    setTimeout(() => {
      messageElement.style.transition = 'all 0.3s ease-out';
      messageElement.style.opacity = '1';
      messageElement.style.transform = 'translateY(0)';
    }, 50);

    // Auto-scroll to bottom with animation
    setTimeout(() => {
      this.chatMessages.scrollTo({
        top: this.chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 300);
  }

  clearChat() {
    this.chatMessages.innerHTML = '';
  }

  handleScratchAuth(authInfo) {
    console.log('Handling Scratch auth in popup:', authInfo);
    this.scratchAuth = authInfo;
    this.updateScratchAuthDisplay(authInfo);

    // Only use Scratch username if current username is the default 'Anonymous'
    // and no custom username has been set by the user
    if (authInfo.isLoggedIn && authInfo.username && this.userName === 'Anonymous') {
      this.userName = authInfo.username;
      if (this.userNameInput) {
        this.userNameInput.value = this.userName;
      }
      console.log('Using Scratch username for collaboration:', this.userName);
    } else {
      console.log('Preserving user-entered username:', this.userName);
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

  showFriendRequests() {
    this.friendsList.style.display = 'block';
    this.loadFriendRequests();
  }

  async loadFriendsList() {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her, um Freunde zu laden');
        return;
      }

      // Send message to content script to get friends from server
      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getFriends'
        }, (response) => {
          if (response && response.success && response.friends) {
            this.displayFriendsList(response.friends);
          } else {
            this.displayFriendsList([]);
          }
        });
      } else {
        this.displayFriendsList([]);
      }
    } catch (error) {
      console.error('Error loading friends list:', error);
      this.displayFriendsList([]);
    }
  }

  displayFriendsList(friends) {
    if (!friends || friends.length === 0) {
      this.friendsList.innerHTML = '<div class="friend-item"><div>Noch keine Freunde</div></div>';
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
            ${friend.status === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        <div class="friend-actions">
          <button class="friend-btn primary"
                  onclick="window.collaborationPopup.inviteFriendToCollaborate('${friend.username}')"
                  title="Zu Zusammenarbeit einladen">
            Einladen
          </button>
          <button class="friend-btn"
                  onclick="window.collaborationPopup.removeFriend('${friend.username}')"
                  title="Freund entfernen"
                  style="color: #d32f2f; border-color: #d32f2f;">
            Entfernen
          </button>
        </div>
      </div>
    `).join('');

    this.friendsList.innerHTML = friendsHtml;
  }

  showInviteFriendDialog() {
    // Show a proper dialog for adding friends
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10003;
    `;

    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 300px;
      width: 90%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    dialogContent.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #ff6b35;">Freund hinzufügen</h3>
      <p style="margin: 0 0 15px 0; font-size: 13px; color: #666;">
        Geben Sie den Scratch-Benutzernamen Ihres Freundes ein:
      </p>
      <input type="text" id="friendUsernameInput" placeholder="Scratch-Benutzername"
             style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
      <div style="display: flex; gap: 10px;">
        <button id="addFriendBtn" style="flex: 1; padding: 10px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
          Hinzufügen
        </button>
        <button id="cancelBtn" style="flex: 1; padding: 10px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 14px;">
          Abbrechen
        </button>
      </div>
    `;

    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    // Handle button clicks
    const addBtn = dialogContent.querySelector('#addFriendBtn');
    const cancelBtn = dialogContent.querySelector('#cancelBtn');
    const usernameInput = dialogContent.querySelector('#friendUsernameInput');

    addBtn.addEventListener('click', () => {
      const friendUsername = usernameInput.value.trim();
      if (friendUsername) {
        this.sendFriendInvitation(friendUsername);
        dialog.remove();
      } else {
        usernameInput.style.borderColor = '#d32f2f';
        usernameInput.placeholder = 'Bitte geben Sie einen Benutzernamen ein';
      }
    });

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addBtn.click();
      }
    });

    // Focus the input
    setTimeout(() => usernameInput.focus(), 100);
  }

  async sendFriendInvitation(friendUsername) {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her, um Freundschaftsanfragen zu senden');
        return;
      }

      // Send friend request through content script to server
      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'addFriend',
          friendUsername: friendUsername
        }, (response) => {
          if (response && response.success) {
            this.showNotification(`Freundschaftsanfrage an ${friendUsername} gesendet`);
            // Refresh friends list
            this.loadFriendsList();
          } else {
            this.showError(response?.error || 'Fehler beim Senden der Freundschaftsanfrage');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt, um Freundschaftsanfragen zu senden');
      }
    } catch (error) {
      console.error('Error sending friend invitation:', error);
      this.showError('Fehler beim Senden der Freundschaftsanfrage');
    }
  }

  inviteFriendToCollaborate(friendUsername) {
    // Invite friend to current collaboration session
    if (this.currentProject) {
      this.sendFriendInvitation(friendUsername);
    } else {
      this.showNotification('Bitte starten Sie zuerst eine Zusammenarbeit');
    }
  }

  async removeFriend(friendUsername) {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her, um Freunde zu entfernen');
        return;
      }

      if (!confirm(`Sind Sie sicher, dass Sie ${friendUsername} aus Ihrer Freundesliste entfernen möchten?`)) {
        return;
      }

      // Send remove friend request through content script to server
      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'removeFriend',
          friendUsername: friendUsername
        }, (response) => {
          if (response && response.success) {
            this.showNotification(`${friendUsername} wurde aus der Freundesliste entfernt`);
            // Refresh friends list
            this.loadFriendsList();
          } else {
            this.showError(response?.error || 'Fehler beim Entfernen des Freundes');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      this.showError('Fehler beim Entfernen des Freundes');
    }
  }

  async loadFriendRequests() {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her, um Freundschaftsanfragen zu laden');
        return;
      }

      // Send message to content script to get friend requests from server
      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getFriendRequests'
        }, (response) => {
          if (response && response.success && response.requests) {
            this.displayFriendRequests(response.requests);
          } else {
            this.displayFriendRequests([]);
          }
        });
      } else {
        this.displayFriendRequests([]);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      this.displayFriendRequests([]);
    }
  }

  displayFriendRequests(requests) {
    if (!requests || requests.length === 0) {
      this.friendsList.innerHTML = '<div class="friend-item"><div>Keine Freundschaftsanfragen</div></div>';
      return;
    }

    const requestsHtml = requests.map(request => `
      <div class="friend-item">
        <img src="/images/avatar-default.png"
             alt="${request.from}"
             class="friend-avatar"
             onerror="this.src='/images/avatar-default.png'">
        <div class="friend-info">
          <div class="friend-name">${request.from}</div>
          <div style="font-size: 10px; color: #666;">
            Freundschaftsanfrage
          </div>
        </div>
        <div class="friend-actions">
          <button class="friend-btn primary"
                  onclick="window.collaborationPopup.acceptFriendRequest('${request.from}')"
                  title="Anfrage annehmen">
            Annehmen
          </button>
          <button class="friend-btn"
                  onclick="window.collaborationPopup.declineFriendRequest('${request.from}')"
                  title="Anfrage ablehnen"
                  style="color: #d32f2f; border-color: #d32f2f;">
            Ablehnen
          </button>
        </div>
      </div>
    `).join('');

    this.friendsList.innerHTML = requestsHtml;
  }

  async acceptFriendRequest(requesterUsername) {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her');
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'acceptFriendRequest',
          requesterUsername: requesterUsername
        }, (response) => {
          if (response && response.success) {
            this.showNotification(`Freundschaftsanfrage von ${requesterUsername} angenommen`);
            // Refresh friends list
            this.loadFriendsList();
          } else {
            this.showError(response?.error || 'Fehler beim Annehmen der Freundschaftsanfrage');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      this.showError('Fehler beim Annehmen der Freundschaftsanfrage');
    }
  }

  async declineFriendRequest(requesterUsername) {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her');
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'declineFriendRequest',
          requesterUsername: requesterUsername
        }, (response) => {
          if (response && response.success) {
            this.showNotification(`Freundschaftsanfrage von ${requesterUsername} abgelehnt`);
            // Refresh friend requests
            this.loadFriendRequests();
          } else {
            this.showError(response?.error || 'Fehler beim Ablehnen der Freundschaftsanfrage');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      this.showError('Fehler beim Ablehnen der Freundschaftsanfrage');
    }
  }

  showNotification(message) {
    // Enhanced notification system with close button - positioned to avoid UI blocking
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-left: 4px solid #ff6b35;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-origin: right center;
      max-width: 280px;
      word-wrap: break-word;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    `;

    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;

    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.2s;
    `;

    // Close button hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    // Close button click handler
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissNotification(notification);
    });

    // Notification click to dismiss (except on close button)
    notification.addEventListener('click', (e) => {
      if (e.target !== closeBtn) {
        dismissNotification(notification);
      }
    });

    // Hover effects for notification
    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'scale(1.02)';
      notification.style.background = 'rgba(0, 0, 0, 0.95)';
    });

    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'scale(1)';
      notification.style.background = 'rgba(0, 0, 0, 0.9)';
    });

    notification.appendChild(messageDiv);
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);

    // Auto-dismiss with fade out animation
    setTimeout(() => {
      if (notification.parentNode) {
        dismissNotification(notification);
      }
    }, 5000);

    // Function to dismiss notification with animation
    function dismissNotification(notif) {
      notif.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notif.parentNode) {
          notif.parentNode.removeChild(notif);
        }
      }, 300);
    }
  }

  // Validate server URL format (supports ngrok and other tunneling services)
  isValidServerUrl(url) {
    try {
      // Handle domain-only inputs by adding https:// protocol
      let fullUrl = url.trim();
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = 'https://' + fullUrl;
      }

      const urlObj = new URL(fullUrl);

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
        '.ngrok-free.dev',
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

      // Allow wildcard matches (*.ngrok.io, *.ngrok-free.app, etc.)
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

        case 'chatMessageReceived':
          this.addChatMessage(request.userName, request.chatMessage, request.isOwnMessage);
          sendResponse({ success: true });
          break;

        case 'chatError':
          this.showError(request.error);
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

        case 'friendRequestReceived':
          this.handleFriendRequestReceived(request);
          sendResponse({ success: true });
          break;

        case 'friendAdded':
          this.handleFriendAdded(request);
          sendResponse({ success: true });
          break;

        case 'friendRequestSent':
          this.handleFriendRequestSent(request);
          sendResponse({ success: true });
          break;

        case 'friendRemoved':
          this.handleFriendRemoved(request);
          sendResponse({ success: true });
          break;

        case 'friendsListReceived':
          this.displayFriendsList(request.friends);
          sendResponse({ success: true });
          break;

        case 'friendRequestsReceived':
          this.displayFriendRequests(request.requests);
          sendResponse({ success: true });
          break;

        case 'friendActionError':
          this.showError(request.error);
          sendResponse({ success: true });
          break;

        case 'notificationsListReceived':
          this.displayNotifications(request.notifications);
          sendResponse({ success: true });
          break;

        case 'notificationMarkedRead':
          this.handleNotificationMarkedRead(request);
          sendResponse({ success: true });
          break;

        case 'allNotificationsMarkedRead':
          this.handleAllNotificationsMarkedRead(request);
          sendResponse({ success: true });
          break;

        case 'notificationDeleted':
          this.handleNotificationDeleted(request);
          sendResponse({ success: true });
          break;

        case 'allNotificationsCleared':
          this.handleAllNotificationsCleared(request);
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
      top: 20px;
      right: 20px;
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
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    `;

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `flex: 1;`;
    contentDiv.innerHTML = `
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

    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.2s;
    `;

    // Close button hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    // Close button click handler
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notification.remove();
    });

    notification.appendChild(contentDiv);
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  handleFriendRequestReceived(request) {
    console.log('Friend request received:', request);
    this.showNotification(`Freundschaftsanfrage von ${request.from} erhalten`);

    // Optionally refresh friend requests if the list is visible
    if (this.friendsList.style.display !== 'none') {
      this.loadFriendRequests();
    }
  }

  handleFriendAdded(request) {
    console.log('Friend added:', request);
    this.showNotification(`${request.friendUsername} ist jetzt Ihr Freund`);

    // Refresh friends list if it's visible
    if (this.friendsList.style.display !== 'none') {
      this.loadFriendsList();
    }
  }

  handleFriendRequestSent(request) {
    console.log('Friend request sent:', request);
    this.showNotification(`Freundschaftsanfrage an ${request.friendUsername} gesendet`);
  }

  handleFriendRemoved(request) {
    console.log('Friend removed:', request);
    this.showNotification(`${request.friendUsername} wurde aus der Freundesliste entfernt`);

    // Refresh friends list if it's visible
    if (this.friendsList.style.display !== 'none') {
      this.loadFriendsList();
    }
  }

  handleNotificationMarkedRead(request) {
    console.log('Notification marked as read:', request);
    // Notification will be refreshed via loadNotifications
  }

  handleAllNotificationsMarkedRead(request) {
    console.log('All notifications marked as read:', request);
    this.showNotification('Alle Nachrichten als gelesen markiert');
  }

  handleNotificationDeleted(request) {
    console.log('Notification deleted:', request);
    // Notification will be refreshed via loadNotifications
  }

  handleAllNotificationsCleared(request) {
    console.log('All notifications cleared:', request);
    this.showNotification('Alle Nachrichten gelöscht');
  }

  // Tab switching functionality
  switchTab(tabName) {
    this.switchTabWithAnimation(tabName);
  }

  // Notification management functions
  async loadNotifications() {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her, um Nachrichten zu laden');
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getNotifications'
        }, (response) => {
          if (response && response.success && response.notifications) {
            this.displayNotifications(response.notifications);
          } else {
            this.displayNotifications([]);
          }
        });
      } else {
        this.displayNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.displayNotifications([]);
    }
  }

  displayNotifications(notifications) {
    if (!this.notificationsList) return;

    // Clear existing notifications with fade out
    const existingNotifications = this.notificationsList.querySelectorAll('.notification-item');
    existingNotifications.forEach((notification, index) => {
      setTimeout(() => {
        notification.style.animation = 'slideInFromTop 0.3s ease-out reverse';
        setTimeout(() => {
          notification.remove();
        }, 250);
      }, index * 30);
    });

    if (!notifications || notifications.length === 0) {
      setTimeout(() => {
        const noNotifications = document.createElement('div');
        noNotifications.className = 'notification-item';
        noNotifications.innerHTML = '<div>Keine Nachrichten</div>';
        this.notificationsList.appendChild(noNotifications);
        this.animateEntrance(noNotifications, 'fade-in', 100);
      }, 200);
      this.updateNotificationBadge(0);
      return;
    }

    // Update badge count
    const unreadCount = notifications.filter(n => !n.read).length;
    this.updateNotificationBadge(unreadCount);

    // Add notifications with staggered animation
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.read ? '' : 'unread'}`;

        notificationElement.innerHTML = `
          <div class="notification-icon">
            ${this.getNotificationIcon(notification.type)}
          </div>
          <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${this.formatNotificationTime(notification.timestamp)}</div>
            ${!notification.read ? `
              <div class="notification-actions">
                <button class="notification-btn" onclick="window.collaborationPopup.markNotificationAsRead('${notification.id}')">
                  Als gelesen markieren
                </button>
                <button class="notification-btn" onclick="window.collaborationPopup.deleteNotification('${notification.id}')" style="color: #d32f2f; border-color: #d32f2f;">
                  Löschen
                </button>
              </div>
            ` : ''}
          </div>
        `;

        this.notificationsList.appendChild(notificationElement);
        this.animateEntrance(notificationElement, 'slide-in-top', 50);
      }, 200 + (index * 100));
    });
  }

  getNotificationIcon(type) {
    const icons = {
      'friendRequest': '👥',
      'friendAccepted': '✅',
      'collaborationInvite': '🚀',
      'system': 'ℹ️',
      'update': '🆕'
    };
    return icons[type] || '📬';
  }

  formatNotificationTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Gerade eben';
    if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Minuten`;
    if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Stunden`;
    return `vor ${Math.floor(diff / 86400000)} Tagen`;
  }

  updateNotificationBadge(count) {
    if (this.notificationBadge) {
      if (count > 0) {
        this.notificationBadge.textContent = count > 99 ? '99+' : count;
        this.notificationBadge.style.display = 'inline-block';
      } else {
        this.notificationBadge.style.display = 'none';
      }
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her');
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'markNotificationRead',
          notificationId: notificationId
        }, (response) => {
          if (response && response.success) {
            this.loadNotifications(); // Refresh notifications
          } else {
            this.showError(response?.error || 'Fehler beim Markieren der Nachricht');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      this.showError('Fehler beim Markieren der Nachricht');
    }
  }

  async markAllNotificationsAsRead() {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her');
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'markAllNotificationsRead'
        }, (response) => {
          if (response && response.success) {
            this.showNotification('Alle Nachrichten als gelesen markiert');
            this.loadNotifications(); // Refresh notifications
          } else {
            this.showError(response?.error || 'Fehler beim Markieren der Nachrichten');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      this.showError('Fehler beim Markieren der Nachrichten');
    }
  }

  async deleteNotification(notificationId) {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her');
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'deleteNotification',
          notificationId: notificationId
        }, (response) => {
          if (response && response.success) {
            this.loadNotifications(); // Refresh notifications
          } else {
            this.showError(response?.error || 'Fehler beim Löschen der Nachricht');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      this.showError('Fehler beim Löschen der Nachricht');
    }
  }

  async clearAllNotifications() {
    try {
      if (!this.isConnected) {
        this.showError('Bitte stellen Sie eine Verbindung her');
        return;
      }

      if (!confirm('Sind Sie sicher, dass Sie alle Nachrichten löschen möchten?')) {
        return;
      }

      const tabs = await chrome.tabs.query({
        url: 'https://scratch.mit.edu/projects/*'
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'clearAllNotifications'
        }, (response) => {
          if (response && response.success) {
            this.showNotification('Alle Nachrichten gelöscht');
            this.loadNotifications(); // Refresh notifications
          } else {
            this.showError(response?.error || 'Fehler beim Löschen der Nachrichten');
          }
        });
      } else {
        this.showError('Bitte öffnen Sie ein Scratch-Projekt');
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      this.showError('Fehler beim Löschen der Nachrichten');
    }
  }

  // Helper method to send messages to background script
  sendMessage(message, retryCount = 0) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message;

            // If connection error and haven't retried too many times, wait and retry
            if (errorMessage.includes('Could not establish connection') && retryCount < 3) {
              console.log(`Connection failed, retrying... (${retryCount + 1}/3)`);
              setTimeout(() => {
                this.sendMessage(message, retryCount + 1).then(resolve).catch(reject);
              }, 1000 * (retryCount + 1)); // Exponential backoff
              return;
            }

            reject(new Error(errorMessage));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.collaborationPopup = new CollaborationPopup();
});
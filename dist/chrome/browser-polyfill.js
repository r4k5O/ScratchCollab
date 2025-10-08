// Browser compatibility polyfill for Scratch Collaboration Extension

(function() {
  'use strict';

  // Detect browser type
  const detectBrowser = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onConnect) {
      return 'chrome';
    } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onConnect) {
      return 'firefox';
    } else if (typeof msBrowser !== 'undefined') {
      return 'edge';
    } else {
      return 'unknown';
    }
  };

  const browserType = detectBrowser();

  // Chrome API polyfill for other browsers
  if (browserType !== 'chrome') {
    window.chrome = window.chrome || {};

    // Runtime API
    if (!chrome.runtime) {
      chrome.runtime = browser.runtime || msBrowser.runtime || {};
    }

    // Tabs API
    if (!chrome.tabs) {
      chrome.tabs = browser.tabs || msBrowser.tabs || {};
    }

    // Storage API
    if (!chrome.storage) {
      chrome.storage = browser.storage || msBrowser.storage || {};
    }

    // Windows API
    if (!chrome.windows) {
      chrome.windows = browser.windows || msBrowser.windows || {};
    }

    // Browser action API (manifest v2)
    if (!chrome.browserAction) {
      chrome.browserAction = browser.browserAction || msBrowser.browserAction || {};
    }

    // Action API (manifest v3)
    if (!chrome.action) {
      chrome.action = browser.action || msBrowser.action || {};
    }
  }

  // Firefox-specific polyfills
  if (browserType === 'firefox') {
    // Firefox uses 'browser' namespace instead of 'chrome'
    if (!window.chrome) {
      window.chrome = browser;
    }
  }

  // Edge-specific polyfills
  if (browserType === 'edge') {
    if (!window.chrome) {
      window.chrome = msBrowser;
    }
  }

  // Common API polyfills
  const originalSendMessage = chrome.runtime.sendMessage;
  chrome.runtime.sendMessage = function(...args) {
    try {
      return originalSendMessage.apply(chrome.runtime, args);
    } catch (error) {
      console.warn('chrome.runtime.sendMessage failed:', error);

      // Fallback for browsers that don't support sendMessage
      if (args[1] && typeof args[1] === 'function') {
        try {
          args[1]({success: false, error: 'Browser API not available'});
        } catch (callbackError) {
          console.error('Callback execution failed:', callbackError);
        }
      }

      return Promise.reject(error);
    }
  };

  // Storage API polyfill
  if (!chrome.storage.local) {
    chrome.storage.local = {
      get: function(keys, callback) {
        try {
          const result = {};
          if (typeof keys === 'string') {
            keys = [keys];
          }
          // Simple localStorage fallback
          keys.forEach(key => {
            try {
              const value = localStorage.getItem(`scratchCollab_${key}`);
              if (value) {
                result[key] = JSON.parse(value);
              }
            } catch (error) {
              console.warn(`Failed to get ${key} from storage:`, error);
            }
          });
          if (callback) callback(result);
          return Promise.resolve(result);
        } catch (error) {
          console.error('Storage get failed:', error);
          if (callback) callback({});
          return Promise.reject(error);
        }
      },

      set: function(items, callback) {
        try {
          Object.keys(items).forEach(key => {
            try {
              localStorage.setItem(`scratchCollab_${key}`, JSON.stringify(items[key]));
            } catch (error) {
              console.warn(`Failed to set ${key} in storage:`, error);
            }
          });
          if (callback) callback();
          return Promise.resolve();
        } catch (error) {
          console.error('Storage set failed:', error);
          if (callback) callback();
          return Promise.reject(error);
        }
      },

      remove: function(keys, callback) {
        try {
          if (typeof keys === 'string') {
            keys = [keys];
          }
          keys.forEach(key => {
            try {
              localStorage.removeItem(`scratchCollab_${key}`);
            } catch (error) {
              console.warn(`Failed to remove ${key} from storage:`, error);
            }
          });
          if (callback) callback();
          return Promise.resolve();
        } catch (error) {
          console.error('Storage remove failed:', error);
          if (callback) callback();
          return Promise.reject(error);
        }
      },

      clear: function(callback) {
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('scratchCollab_')) {
              localStorage.removeItem(key);
            }
          });
          if (callback) callback();
          return Promise.resolve();
        } catch (error) {
          console.error('Storage clear failed:', error);
          if (callback) callback();
          return Promise.reject(error);
        }
      }
    };
  }

  // Tabs API polyfill
  if (!chrome.tabs.query) {
    chrome.tabs.query = function(queryInfo, callback) {
      try {
        // Simple fallback - return current tab
        if (callback) {
          callback([{
            id: 1,
            url: window.location.href,
            title: document.title
          }]);
        }
        return Promise.resolve([{
          id: 1,
          url: window.location.href,
          title: document.title
        }]);
      } catch (error) {
        console.error('Tabs query failed:', error);
        if (callback) callback([]);
        return Promise.reject(error);
      }
    };
  }

  if (!chrome.tabs.sendMessage) {
    chrome.tabs.sendMessage = function(tabId, message, callback) {
      try {
        // Simple fallback - dispatch custom event
        const event = new CustomEvent('scratchCollabMessage', {
          detail: message
        });
        window.dispatchEvent(event);

        if (callback) callback({success: true});
        return Promise.resolve({success: true});
      } catch (error) {
        console.error('Tabs sendMessage failed:', error);
        if (callback) callback({success: false, error: error.message});
        return Promise.reject(error);
      }
    };
  }

  // Browser info polyfill
  window.scratchCollabBrowserInfo = {
    type: browserType,
    isChrome: browserType === 'chrome',
    isFirefox: browserType === 'firefox',
    isEdge: browserType === 'edge',
    isWebkit: browserType === 'safari' || window.safari !== undefined,
    supportsManifestV3: browserType === 'chrome' || (browserType === 'firefox' && parseInt(navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') >= 109),
    supportsServiceWorkers: 'serviceWorker' in navigator,
    supportsWebSockets: 'WebSocket' in window,
    supportsLocalStorage: 'localStorage' in window
  };

  console.log('Browser compatibility polyfill loaded for:', browserType);

})();
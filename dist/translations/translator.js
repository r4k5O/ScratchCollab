// Translation utility for Scratch Collaboration Extension

class Translator {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {};
    this.fallbackLanguage = 'en';
  }

  // Initialize translator with available languages
  async init() {
    try {
      // Load available languages
      const languages = ['en', 'de']; // Add more languages as needed

      for (const lang of languages) {
        try {
          const response = await fetch(`translations/${lang}.json`);
          if (response.ok) {
            this.translations[lang] = await response.json();
            console.log(`Loaded translations for language: ${lang}`);
          }
        } catch (error) {
          console.warn(`Could not load translations for ${lang}:`, error);
        }
      }

      // Set initial language
      this.setLanguage(this.detectBrowserLanguage());
    } catch (error) {
      console.error('Error initializing translator:', error);
    }
  }

  // Detect browser language
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0]; // Get primary language code

    return this.isLanguageSupported(langCode) ? langCode : this.fallbackLanguage;
  }

  // Check if language is supported
  isLanguageSupported(langCode) {
    return this.translations.hasOwnProperty(langCode);
  }

  // Set current language
  setLanguage(language) {
    if (this.isLanguageSupported(language)) {
      this.currentLanguage = language;
      console.log(`Language set to: ${language}`);

      // Notify all components about language change
      this.notifyLanguageChange(language);
      return true;
    } else {
      console.warn(`Language not supported: ${language}`);
      return false;
    }
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get available languages
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  // Translate a key path
  translate(keyPath, substitutions = {}) {
    const keys = keyPath.split('.');
    let value = this.translations[this.currentLanguage];

    // Navigate through the translation object
    for (const key of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(key)) {
        value = value[key];
      } else {
        // Fallback to English if key not found
        if (this.currentLanguage !== this.fallbackLanguage) {
          value = this.translations[this.fallbackLanguage];
          for (const fallbackKey of keys) {
            if (value && typeof value === 'object' && value.hasOwnProperty(fallbackKey)) {
              value = value[fallbackKey];
            } else {
              value = undefined;
              break;
            }
          }
        } else {
          value = undefined;
        }
        break;
      }
    }

    // Use the key path as fallback if translation not found
    if (value === undefined) {
      console.warn(`Translation not found for key: ${keyPath}`);
      value = keyPath;
    }

    // Apply substitutions
    if (typeof value === 'string') {
      return this.applySubstitutions(value, substitutions);
    }

    return value;
  }

  // Apply substitutions to translated string
  applySubstitutions(text, substitutions) {
    let result = text;

    for (const [key, value] of Object.entries(substitutions)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    return result;
  }

  // Notify components about language change
  notifyLanguageChange(language) {
    // Dispatch custom event for language change
    const event = new CustomEvent('scratchCollabLanguageChange', {
      detail: { language }
    });
    document.dispatchEvent(event);

    // Also send message to background script for cross-component communication
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'languageChanged',
        language: language
      });
    }
  }

  // Listen for language change events
  onLanguageChange(callback) {
    document.addEventListener('scratchCollabLanguageChange', (event) => {
      callback(event.detail.language);
    });
  }

  // Get all supported languages with their names
  getLanguageOptions() {
    const languageNames = {
      'en': 'English',
      'de': 'Deutsch',
      'es': 'Español',
      'fr': 'Français',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'nl': 'Nederlands',
      'da': 'Dansk',
      'fi': 'Suomi',
      'nb': 'Norsk',
      'sv': 'Svenska',
      'pl': 'Polski',
      'tr': 'Türkçe',
      'ja': '日本語',
      'ko': '한국어',
      'zh-cn': '中文 (简体)',
      'zh-tw': '中文 (繁體)',
      'ar': 'العربية',
      'ca': 'Català'
    };

    const options = {};
    for (const [code, name] of Object.entries(languageNames)) {
      if (this.isLanguageSupported(code)) {
        options[code] = name;
      }
    }

    return options;
  }
}

// Create global translator instance
const translator = new Translator();

// Initialize translator when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => translator.init());
} else {
  translator.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Translator;
}
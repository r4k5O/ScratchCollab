// Build script for Scratch Collaboration Extension

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ExtensionBuilder {
  constructor() {
    this.sourceDir = __dirname;
    this.buildDir = path.join(this.sourceDir, 'dist');
    this.serverDir = path.join(this.sourceDir, 'server');
  }

  build() {
    console.log('🚀 Building Scratch Collaboration Extension...\n');

    try {
      // Create build directories
      this.createBuildDirectories();

      // Copy extension files
      this.copyExtensionFiles();

      // Build for multiple browsers
      this.buildForBrowsers();

      // Build server
      this.buildServer();

      // Create installation instructions
      this.createInstallationGuide();

      console.log('✅ Build completed successfully!');
      console.log(`📦 Extensions built in: ${this.buildDir}`);
      console.log(`🖥️  Server built in: ${this.serverDir}`);
      console.log('\n📋 Next steps:');
      console.log('1. Load the extension from the appropriate browser folder (chrome/, firefox/, etc.)');
      console.log('2. Start the server with: cd server && npm start');
      console.log('3. Open a Scratch project and start collaborating!');

    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  createBuildDirectories() {
    // Create main build directory
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.buildDir, { recursive: true });

    // Create browser-specific directories
    const browsers = ['chrome', 'firefox', 'edge'];
    browsers.forEach(browser => {
      const browserDir = path.join(this.buildDir, browser);
      fs.mkdirSync(browserDir, { recursive: true });
    });

    console.log('📁 Created build directories');
  }

  copyExtensionFiles() {
    console.log('📋 Copying extension files...');

    const filesToCopy = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'content.js',
      'background.js'
    ];

    // Copy translation files
    this.copyTranslationFiles();

    filesToCopy.forEach(file => {
      const sourcePath = path.join(this.sourceDir, file);
      const destPath = path.join(this.buildDir, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ ${file}`);
      } else {
        console.warn(`  ⚠ ${file} not found, skipping`);
      }
    });

    // Create icons directory (placeholder)
    const iconsDir = path.join(this.buildDir, 'icons');
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('  ✓ icons/ (directory)');

    // Copy translation files
    this.copyTranslationFiles();
  }

  buildServer() {
    console.log('🔧 Building server...');

    // Check if we're in the right directory
    if (!fs.existsSync(path.join(this.serverDir, 'package.json'))) {
      console.log('  ⚠ Server package.json not found, skipping server build');
      return;
    }

    try {
      // Install server dependencies
      console.log('  📦 Installing server dependencies...');
      execSync('npm install', {
        cwd: this.serverDir,
        stdio: 'inherit'
      });

      console.log('  ✓ Server dependencies installed');
    } catch (error) {
      console.log('  ⚠ Could not install server dependencies (npm not available?)');
      console.log('    You can install them manually later with: cd server && npm install');
    }
  }

  copyTranslationFiles() {
    const translationsDir = path.join(this.sourceDir, 'translations');

    if (fs.existsSync(translationsDir)) {
      const destTranslationsDir = path.join(this.buildDir, 'translations');
      fs.mkdirSync(destTranslationsDir, { recursive: true });

      const translationFiles = fs.readdirSync(translationsDir).filter(file =>
        file.endsWith('.json') || file.endsWith('.js')
      );

      translationFiles.forEach(file => {
        const sourcePath = path.join(translationsDir, file);
        const destPath = path.join(destTranslationsDir, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ translations/${file}`);
      });
    } else {
      console.log('  ⚠ translations/ directory not found, skipping');
    }
  }

  buildForBrowsers() {
    console.log('🌐 Building for multiple browsers...');

    const browsers = [
      { name: 'chrome', manifest: 'manifest.json' },
      { name: 'firefox', manifest: 'manifest/firefox.json' }
    ];

    browsers.forEach(browser => {
      console.log(`  📦 Building for ${browser.name}...`);

      const browserDir = path.join(this.buildDir, browser.name);

      // Copy common files
      const commonFiles = [
        'popup.html',
        'popup.js',
        'content.js',
        'background.js',
        'browser-polyfill.js'
      ];

      commonFiles.forEach(file => {
        const sourcePath = path.join(this.sourceDir, file);
        const destPath = path.join(browserDir, file);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      });

      // Copy manifest
      if (browser.manifest) {
        const manifestSource = path.join(this.sourceDir, browser.manifest);
        const manifestDest = path.join(browserDir, 'manifest.json');
        if (fs.existsSync(manifestSource)) {
          fs.copyFileSync(manifestSource, manifestDest);
          console.log(`    ✓ manifest.json (${browser.name})`);
        }
      }

      // Copy translation files
      this.copyTranslationFilesToBrowser(browserDir);

      // Create icons directory
      const iconsDir = path.join(browserDir, 'icons');
      fs.mkdirSync(iconsDir, { recursive: true });
      console.log(`    ✓ icons/ (directory)`);

      console.log(`    ✅ ${browser.name} build completed`);
    });
  }

  copyTranslationFilesToBrowser(browserDir) {
    const translationsDir = path.join(this.sourceDir, 'translations');

    if (fs.existsSync(translationsDir)) {
      const destTranslationsDir = path.join(browserDir, 'translations');
      fs.mkdirSync(destTranslationsDir, { recursive: true });

      const translationFiles = fs.readdirSync(translationsDir).filter(file =>
        file.endsWith('.json') || file.endsWith('.js')
      );

      translationFiles.forEach(file => {
        const sourcePath = path.join(translationsDir, file);
        const destPath = path.join(destTranslationsDir, file);
        fs.copyFileSync(sourcePath, destPath);
      });
    }
  }

  createInstallationGuide() {
    const guideContent = `# Scratch Collaboration Extension

A Chrome extension that enables real-time collaboration on Scratch projects.

## Installation

### 1. Browser Extension Setup

#### Chrome / Chromium browsers:
1. Open Chrome and navigate to \`chrome://extensions/\`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the \`dist/chrome\` folder
4. The extension should now appear in your extensions list

#### Firefox:
1. Open Firefox and navigate to \`about:debugging\`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Select the \`manifest.json\` file from the \`dist/firefox\` folder
5. The extension should now appear in your extensions list

#### Microsoft Edge:
1. Open Edge and navigate to \`edge://extensions/\`
2. Enable "Developer mode" in the left sidebar
3. Click "Load unpacked" and select the \`dist/edge\` folder
4. The extension should now appear in your extensions list

### 2. Server Setup

1. Open a terminal/command prompt
2. Navigate to the \`server\` directory:
   \`\`\`bash
   cd server
   \`\`\`

3. Install dependencies (if not already done):
   \`\`\`bash
   npm install
   \`\`\`

4. Start the collaboration server:
   \`\`\`bash
   npm start
   \`\`\`

5. The server should start on \`http://localhost:3000\`

### 3. Usage

1. Open a Scratch project: https://scratch.mit.edu/projects/[PROJECT_ID]
2. Click the extension icon in Chrome
3. Enter your name and click "Start Collaboration"
4. Share the project ID with collaborators
5. Start collaborating in real-time!

## Features

- **Real-time collaboration**: See changes from other users instantly
- **User presence**: See who else is working on the project
- **Project synchronization**: All changes are shared across users
- **Local server**: No external dependencies required

## Development

To modify the extension:

1. Make changes to the source files in the root directory
2. Run the build script:
   \`\`\`bash
   node build.js
   \`\`\`
3. Reload the extension in Chrome (\`chrome://extensions/\`)
4. Test your changes

## Troubleshooting

### Extension not loading?
- Make sure you're loading from the \`dist\` folder, not the root directory
- Check the console for any errors

### Server not starting?
- Make sure port 3000 is available
- Check that Node.js is installed
- Try: \`npm install\` in the server directory

### Collaboration not working?
- Ensure the server is running
- Check that all users are on the same project
- Verify the server URL in the extension settings

## File Structure

\`\`\`
├── dist/                          # Built extensions (load from browser-specific folders)
│   ├── chrome/                    # Chrome/Chromium extension
│   │   ├── manifest.json         # Chrome manifest (v3)
│   │   ├── popup.html
│   │   ├── popup.js
│   │   ├── content.js
│   │   ├── background.js
│   │   ├── browser-polyfill.js
│   │   ├── translations/
│   │   └── icons/
│   ├── firefox/                   # Firefox extension
│   │   ├── manifest.json         # Firefox manifest (v2)
│   │   ├── popup.html
│   │   ├── popup.js
│   │   ├── content.js
│   │   ├── background.js
│   │   ├── browser-polyfill.js
│   │   ├── translations/
│   │   └── icons/
│   └── edge/                      # Microsoft Edge extension
│       ├── manifest.json
│       └── ... (same as chrome)
├── server/                        # Collaboration server
│   ├── server.js
│   ├── package.json
│   └── README.md
├── manifest/                      # Browser-specific manifests
│   ├── firefox.json              # Firefox manifest template
│   └── ... (other browsers)
├── translations/                  # Translation files
│   ├── en.json                   # English translations
│   ├── de.json                   # German translations
│   └── translator.js             # Translation manager
├── build.js                      # This build script
├── package.json                  # Project configuration
└── README.md                     # This file
\`\`\`

## License

MIT
`;

    fs.writeFileSync(path.join(this.buildDir, 'INSTALLATION_GUIDE.md'), guideContent);
    console.log('📖 Created installation guide');
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  const builder = new ExtensionBuilder();
  builder.build();
}

module.exports = ExtensionBuilder;
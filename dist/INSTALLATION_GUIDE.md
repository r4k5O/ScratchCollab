# Scratch Collaboration Extension

A Chrome extension that enables real-time collaboration on Scratch projects.

## Installation

### 1. Browser Extension Setup

#### Chrome / Chromium browsers:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist/chrome` folder
4. The extension should now appear in your extensions list

#### Firefox:
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from the `dist/firefox` folder
5. The extension should now appear in your extensions list

#### Microsoft Edge:
1. Open Edge and navigate to `edge://extensions/`
2. Enable "Developer mode" in the left sidebar
3. Click "Load unpacked" and select the `dist/edge` folder
4. The extension should now appear in your extensions list

### 2. Server Setup

1. Open a terminal/command prompt
2. Navigate to the `server` directory:
   ```bash
   cd server
   ```

3. Install dependencies (if not already done):
   ```bash
   npm install
   ```

4. Start the collaboration server:
   ```bash
   npm start
   ```

5. The server should start on `http://localhost:3000`

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
   ```bash
   node build.js
   ```
3. Reload the extension in Chrome (`chrome://extensions/`)
4. Test your changes

## Troubleshooting

### Extension not loading?
- Make sure you're loading from the `dist` folder, not the root directory
- Check the console for any errors

### Server not starting?
- Make sure port 3000 is available
- Check that Node.js is installed
- Try: `npm install` in the server directory

### Collaboration not working?
- Ensure the server is running
- Check that all users are on the same project
- Verify the server URL in the extension settings

## File Structure

```
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
```

## License

MIT

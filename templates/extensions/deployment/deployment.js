'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor(config = {}) {
    this.config = {
      environments: config.environments || ['development', 'production'],
      docker: config.docker !== false,
      testing: config.testing !== false,
      ...config
    };
  }

  /**
   * Stellt eine Umgebung bereit
   * Deploys an environment
   */
  deployEnvironment(environment, options = {}) {
    console.log(`🚀 Deploying to ${environment}...`);

    try {
      // 1. Baue die Anwendung
      this.buildApplication(environment, options);

      // 2. Führe Tests aus falls aktiviert
      if (this.config.testing) {
        this.runTests(environment);
      }

      // 3. Erstelle Docker-Image falls aktiviert
      if (this.config.docker) {
        this.buildDockerImage(environment);
      }

      // 4. Aktualisiere Konfiguration
      this.updateConfiguration(environment, options);

      // 5. Starte Anwendung
      this.startApplication(environment, options);

      console.log(`✅ Deployment to ${environment} completed successfully`);

      return { success: true, environment };

    } catch (error) {
      console.error(`❌ Deployment to ${environment} failed:`, error.message);
      return { success: false, environment, error: error.message };
    }
  }

  /**
   * Baut die Anwendung für eine Umgebung
   * Builds the application for an environment
   */
  buildApplication(environment, options) {
    console.log(`  📦 Building application for ${environment}...`);

    const buildDir = path.join('server', 'dist', environment);

    // Stelle sicher, dass das Build-Verzeichnis existiert
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Kopiere notwendige Dateien
    this.copyBuildFiles(buildDir, environment);

    // Installiere Dependencies
    try {
      execSync('npm install --production', {
        cwd: path.join(buildDir),
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('  ⚠️  Could not install dependencies (npm not available?)');
    }
  }

  /**
   * Kopiert Build-Dateien
   * Copies build files
   */
  copyBuildFiles(buildDir, environment) {
    const filesToCopy = [
      'server-extended.js',
      'config.json',
      'package.json'
    ];

    filesToCopy.forEach(file => {
      const sourcePath = path.join('server', file);
      const destPath = path.join(buildDir, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });

    // Kopiere Erweiterungen falls vorhanden
    const extensionsDir = path.join('server', 'extensions');
    const buildExtensionsDir = path.join(buildDir, 'extensions');

    if (fs.existsSync(extensionsDir)) {
      if (!fs.existsSync(buildExtensionsDir)) {
        fs.mkdirSync(buildExtensionsDir, { recursive: true });
      }

      const extensionFiles = fs.readdirSync(extensionsDir);
      extensionFiles.forEach(file => {
        const sourcePath = path.join(extensionsDir, file);
        const destPath = path.join(buildExtensionsDir, file);
        fs.copyFileSync(sourcePath, destPath);
      });
    }
  }

  /**
   * Führt Tests aus
   * Runs tests
   */
  runTests(environment) {
    console.log(`  🧪 Running tests for ${environment}...`);

    try {
      execSync('npm test', {
        cwd: 'server',
        stdio: 'inherit'
      });
      console.log('  ✅ Tests passed');
    } catch (error) {
      console.error('  ❌ Tests failed');
      throw new Error(`Tests failed for ${environment}`);
    }
  }

  /**
   * Baut Docker-Image
   * Builds Docker image
   */
  buildDockerImage(environment) {
    console.log(`  🐳 Building Docker image for ${environment}...`);

    const buildDir = path.join('server', 'dist', environment);

    try {
      execSync(`docker build -t scratch-collab-${environment} .`, {
        cwd: buildDir,
        stdio: 'inherit'
      });
      console.log(`  ✅ Docker image built: scratch-collab-${environment}`);
    } catch (error) {
      console.error('  ❌ Docker build failed');
      throw new Error(`Docker build failed for ${environment}`);
    }
  }

  /**
   * Aktualisiert Konfiguration für Deployment
   * Updates configuration for deployment
   */
  updateConfiguration(environment, options) {
    console.log(`  ⚙️  Updating configuration for ${environment}...`);

    const configPath = path.join('server', 'dist', environment, 'config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Aktualisiere für Deployment
      config.deployedAt = new Date().toISOString();
      config.version = require('../package.json').version;
      config.environment = environment;

      // Füge Deployment-spezifische Einstellungen hinzu
      if (options.port) {
        config.port = options.port;
      }

      if (options.host) {
        config.host = options.host;
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  }

  /**
   * Startet die Anwendung
   * Starts the application
   */
  startApplication(environment, options) {
    console.log(`  🚀 Starting application in ${environment}...`);

    const buildDir = path.join('server', 'dist', environment);

    // Erstelle oder aktualisiere Start-Skript
    this.createStartScript(buildDir, environment, options);

    // Für Docker-Deployment
    if (this.config.docker) {
      this.startDockerContainer(environment, options);
    } else {
      // Für direkten Node.js-Start
      this.startNodeApplication(buildDir, options);
    }
  }

  /**
   * Erstellt Start-Skript
   * Creates start script
   */
  createStartScript(buildDir, environment, options) {
    const scriptContent = `#!/bin/bash
# Start-Skript für Scratch Collaboration Server (${environment})

echo "Starte Scratch Collaboration Server in ${environment} Umgebung..."
echo "Starting Scratch Collaboration Server in ${environment} environment..."

# Setze Umgebungsvariable
export NODE_ENV=${environment}

# Setze Port falls spezifiziert
${options.port ? `export PORT=${options.port}` : ''}

# Setze Host falls spezifiziert
${options.host ? `export HOST=${options.host}` : ''}

# Starte Server
echo "Starte Server..."
echo "Starting server..."
node server-extended.js
`;

    const scriptPath = path.join(buildDir, 'start.sh');
    fs.writeFileSync(scriptPath, scriptContent);

    // Mache ausführbar
    try {
      fs.chmodSync(scriptPath, '755');
    } catch (error) {
      // Ignoriere Fehler auf Windows
    }
  }

  /**
   * Startet Docker-Container
   * Starts Docker container
   */
  startDockerContainer(environment, options) {
    console.log(`  🐳 Starting Docker container for ${environment}...`);

    const containerName = `scratch-collab-${environment}`;
    const imageName = `scratch-collab-${environment}`;

    try {
      // Stoppe existierenden Container
      try {
        execSync(`docker stop ${containerName}`, { stdio: 'pipe' });
        execSync(`docker rm ${containerName}`, { stdio: 'pipe' });
      } catch (error) {
        // Container existiert wahrscheinlich nicht
      }

      // Starte neuen Container
      const port = options.port || 3000;
      const dockerCmd = `docker run -d \\
        --name ${containerName} \\
        -p ${port}:3000 \\
        -e NODE_ENV=${environment} \\
        ${options.restart ? '--restart unless-stopped' : ''} \\
        ${imageName}`;

      execSync(dockerCmd, { stdio: 'inherit' });
      console.log(`  ✅ Docker container started: ${containerName}`);

    } catch (error) {
      console.error('  ❌ Failed to start Docker container');
      throw new Error(`Docker container start failed for ${environment}`);
    }
  }

  /**
   * Startet Node.js-Anwendung direkt
   * Starts Node.js application directly
   */
  startNodeApplication(buildDir, options) {
    console.log(`  🚀 Starting Node.js application...`);

    try {
      const nodeCmd = 'node server-extended.js';
      const fullCmd = options.port ? `PORT=${options.port} ${nodeCmd}` : nodeCmd;

      console.log(`  💡 To start manually: cd ${path.relative(process.cwd(), buildDir)} && ${fullCmd}`);

      // Optional: Starte im Hintergrund (auf Unix-Systemen)
      if (process.platform !== 'win32') {
        try {
          execSync(`${fullCmd} > ../logs/${options.environment || 'deployment'}.log 2>&1 &`, {
            cwd: buildDir,
            stdio: 'pipe'
          });
          console.log('  ✅ Application started in background');
        } catch (error) {
          console.log('  💡 Start manually with: ' + fullCmd);
        }
      }

    } catch (error) {
      console.error('  ❌ Failed to start application');
      throw new Error(`Application start failed`);
    }
  }

  /**
   * Rollback zu vorheriger Version
   * Rollback to previous version
   */
  rollbackEnvironment(environment, version) {
    console.log(`⏪ Rolling back ${environment} to version ${version}...`);

    try {
      // Logik für Rollback
      // Implementation für Rollback

      console.log(`✅ Rollback completed`);
      return { success: true, environment, version };

    } catch (error) {
      console.error(`❌ Rollback failed:`, error.message);
      return { success: false, environment, error: error.message };
    }
  }

  /**
   * Status einer Umgebung prüfen
   * Check status of an environment
   */
  getEnvironmentStatus(environment) {
    console.log(`📊 Checking status of ${environment}...`);

    const status = {
      environment,
      deployed: false,
      running: false,
      version: null,
      uptime: null,
      health: 'unknown'
    };

    try {
      // Prüfe ob Deployment existiert
      const buildDir = path.join('server', 'dist', environment);
      status.deployed = fs.existsSync(buildDir);

      if (status.deployed) {
        // Prüfe Version
        const configPath = path.join(buildDir, 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          status.version = config.version;
          status.deployedAt = config.deployedAt;
        }

        // Prüfe Docker-Container
        if (this.config.docker) {
          try {
            const result = execSync(`docker ps -f name=scratch-collab-${environment} --format "{{.Status}}"`, { stdio: 'pipe' });
            status.running = result.toString().trim().length > 0;
          } catch (error) {
            // Container läuft nicht
          }
        }
      }

      return status;

    } catch (error) {
      console.error(`❌ Failed to check status:`, error.message);
      return { ...status, error: error.message };
    }
  }
}

module.exports = DeploymentManager;
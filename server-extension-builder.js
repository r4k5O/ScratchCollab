
/**
 * Automatisches Server-Erweiterungs- und Bau-Skript
 * Automatic Server Extension and Build Script
 *
 * Dieses Skript erweitert den Scratch Collaboration Server um neue Features,
 * konfiguriert ihn für verschiedene Umgebungen und automatisiert den Build-Prozess.
 *
 * This script extends the Scratch Collaboration Server with new features,
 * configures it for different environments, and automates the build process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ServerExtensionBuilder {
  constructor() {
    this.serverDir = path.join(__dirname, 'server');
    this.extensionsDir = path.join(this.serverDir, 'extensions');
    this.configDir = path.join(this.serverDir, 'config');
    this.buildDir = path.join(this.serverDir, 'dist');
    this.docsDir = path.join(this.serverDir, 'docs');

    // Verfügbare Erweiterungen / Available extensions
    this.availableExtensions = {
      monitoring: {
        name: 'Monitoring & Health Checks',
        description: 'Erweiterte Überwachung und Gesundheitsprüfungen',
        files: ['monitoring.js', 'health-check.js']
      },
      api: {
        name: 'Extended API',
        description: 'Zusätzliche REST API Endpunkte',
        files: ['api-extensions.js', 'rate-limiter.js']
      },
      auth: {
        name: 'Authentication',
        description: 'Erweiterte Authentifizierung und Autorisierung',
        files: ['auth.js', 'jwt-manager.js']
      },
      logging: {
        name: 'Advanced Logging',
        description: 'Erweiterte Protokollierung und Audit-Trails',
        files: ['logger.js', 'audit-log.js']
      },
      deployment: {
        name: 'Deployment Tools',
        description: 'Tools für automatisierte Bereitstellung',
        files: ['deployment.js', 'docker-setup.js']
      }
    };
  }

  /**
   * Hauptmethode zum Erweitern und Bauen des Servers
   * Main method to extend and build the server
   */
  build(options = {}) {
    console.log('🚀 Starte automatisches Server-Erweiterungs- und Bau-Skript...\n');
    console.log('🚀 Starting automatic server extension and build script...\n');

    try {
      // Erstelle notwendige Verzeichnisse
      this.createDirectories();

      // Erweitere den Server basierend auf Optionen
      this.extendServer(options);

      // Konfiguriere für verschiedene Umgebungen
      this.configureEnvironments(options);

      // Baue den Server
      this.buildServer(options);

      // Erstelle Dokumentation
      this.generateDocumentation(options);

      // Setup für Tests
      this.setupTesting(options);

      console.log('✅ Server-Erweiterung und -Bau erfolgreich abgeschlossen!');
      console.log('✅ Server extension and build completed successfully!');
      console.log('\n📋 Nächste Schritte / Next steps:');
      console.log('1. Testen Sie den erweiterten Server: cd server && npm start');
      console.log('2. Überprüfen Sie die Dokumentation in server/docs/');
      console.log('3. Passen Sie die Konfiguration in server/config/ an Ihre Bedürfnisse an');
      console.log('4. Starten Sie den Server in der gewünschten Umgebung');

    } catch (error) {
      console.error('❌ Fehler beim Server-Erweitern und -Bauen:', error.message);
      console.error('❌ Error during server extension and build:', error.message);
      process.exit(1);
    }
  }

  /**
   * Erstellt notwendige Verzeichnisse
   * Creates necessary directories
   */
  createDirectories() {
    console.log('📁 Erstelle Verzeichnisstruktur...');

    const directories = [
      this.extensionsDir,
      this.configDir,
      this.buildDir,
      this.docsDir,
      path.join(this.docsDir, 'api'),
      path.join(this.serverDir, 'tests'),
      path.join(this.serverDir, 'logs')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✓ ${path.relative(this.serverDir, dir)}`);
      }
    });
  }

  /**
   * Erweitert den Server um neue Features
   * Extends the server with new features
   */
  extendServer(options) {
    console.log('\n🔧 Erweitere Server um neue Features...');

    const extensions = options.extensions || ['monitoring', 'api', 'logging'];

    extensions.forEach(extension => {
      if (this.availableExtensions[extension]) {
        console.log(`  📦 Installiere ${this.availableExtensions[extension].name}...`);
        this.installExtension(extension, options);
      }
    });

    // Erstelle erweiterte Server-Datei
    this.createExtendedServer(options);
  }

  /**
   * Installiert eine spezifische Erweiterung
   * Installs a specific extension
   */
  installExtension(extension, options) {
    const extensionConfig = this.availableExtensions[extension];

    extensionConfig.files.forEach(file => {
      const sourceFile = path.join(__dirname, 'templates', 'extensions', extension, file);
      const destFile = path.join(this.extensionsDir, file);

      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`    ✓ ${file}`);
      } else {
        // Erstelle Standard-Datei falls Template nicht existiert
        this.createExtensionFile(extension, file, destFile);
      }
    });
  }

  /**
   * Erstellt eine Erweiterungs-Datei
   * Creates an extension file
   */
  createExtensionFile(extension, file, destPath) {
    let content = '';

    switch (extension) {
      case 'monitoring':
        if (file === 'monitoring.js') {
          content = this.getMonitoringExtensionContent();
        } else if (file === 'health-check.js') {
          content = this.getHealthCheckExtensionContent();
        }
        break;

      case 'api':
        if (file === 'api-extensions.js') {
          content = this.getApiExtensionsContent();
        } else if (file === 'rate-limiter.js') {
          content = this.getRateLimiterContent();
        }
        break;

      case 'logging':
        if (file === 'logger.js') {
          content = this.getLoggerExtensionContent();
        } else if (file === 'audit-log.js') {
          content = this.getAuditLogContent();
        }
        break;
    }

    if (content) {
      fs.writeFileSync(destPath, content);
      console.log(`    ✓ ${file} (created)`);
    }
  }

  /**
   * Erstellt den erweiterten Server
   * Creates the extended server
   */
  createExtendedServer(options) {
    console.log('  🔨 Erstelle erweiterten Server...');

    const extendedServerContent = this.getExtendedServerContent(options);
    const extendedServerPath = path.join(this.serverDir, 'server-extended.js');

    fs.writeFileSync(extendedServerPath, extendedServerContent);
    console.log('    ✓ server-extended.js');
  }

  /**
   * Konfiguriert verschiedene Umgebungen
   * Configures different environments
   */
  configureEnvironments(options) {
    console.log('\n⚙️  Konfiguriere Umgebungen...');

    // Development Config
    const devConfig = {
      name: 'development',
      port: 3000,
      environment: 'dev',
      logging: {
        level: 'debug',
        file: './logs/dev.log'
      },
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:8080'],
        credentials: true
      },
      rateLimiting: {
        enabled: false
      },
      monitoring: {
        enabled: true,
        interval: 30000
      }
    };

    // Production Config
    const prodConfig = {
      name: 'production',
      port: process.env.PORT || 3000,
      environment: 'prod',
      logging: {
        level: 'warn',
        file: './logs/prod.log'
      },
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://yourdomain.com'],
        credentials: true
      },
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 Minuten
        max: 100 // Limit pro Fenster
      },
      monitoring: {
        enabled: true,
        interval: 60000
      },
      security: {
        helmet: true,
        ssl: process.env.SSL_ENABLED === 'true'
      }
    };

    // Test Config
    const testConfig = {
      name: 'test',
      port: 3001,
      environment: 'test',
      logging: {
        level: 'error',
        file: './logs/test.log'
      },
      cors: {
        origin: ['http://localhost:3001'],
        credentials: true
      },
      rateLimiting: {
        enabled: false
      },
      monitoring: {
        enabled: false
      }
    };

    const configs = { development: devConfig, production: prodConfig, test: testConfig };
    const environments = options.environments || ['development', 'production'];

    environments.forEach(env => {
      const configPath = path.join(this.configDir, `${env}.json`);
      fs.writeFileSync(configPath, JSON.stringify(configs[env], null, 2));
      console.log(`    ✓ ${env}.json`);
    });
  }

  /**
   * Baut den Server für verschiedene Umgebungen
   * Builds the server for different environments
   */
  buildServer(options) {
    console.log('\n🏗️  Baue Server...');

    const environments = options.environments || ['development', 'production'];

    environments.forEach(env => {
      console.log(`  📦 Baue für ${env}...`);

      const buildEnvDir = path.join(this.buildDir, env);
      if (!fs.existsSync(buildEnvDir)) {
        fs.mkdirSync(buildEnvDir, { recursive: true });
      }

      // Kopiere Server-Dateien
      this.copyServerFiles(buildEnvDir);

      // Kopiere Konfiguration
      const configSource = path.join(this.configDir, `${env}.json`);
      const configDest = path.join(buildEnvDir, 'config.json');
      if (fs.existsSync(configSource)) {
        fs.copyFileSync(configSource, configDest);
      }

      // Erstelle Start-Skript
      this.createStartScript(buildEnvDir, env);

      // Erstelle Dockerfile falls gewünscht
      if (options.docker) {
        this.createDockerfile(buildEnvDir, env);
      }

      console.log(`    ✅ ${env} build completed`);
    });
  }

  /**
   * Kopiert Server-Dateien in das Build-Verzeichnis
   * Copies server files to build directory
   */
  copyServerFiles(buildDir) {
    const filesToCopy = [
      'server.js',
      'server-extended.js',
      'package.json'
    ];

    filesToCopy.forEach(file => {
      const sourcePath = path.join(this.serverDir, file);
      const destPath = path.join(buildDir, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });

    // Kopiere Erweiterungen
    if (fs.existsSync(this.extensionsDir)) {
      const extensionsDest = path.join(buildDir, 'extensions');
      if (!fs.existsSync(extensionsDest)) {
        fs.mkdirSync(extensionsDest, { recursive: true });
      }

      const extensionFiles = fs.readdirSync(this.extensionsDir);
      extensionFiles.forEach(file => {
        const sourcePath = path.join(this.extensionsDir, file);
        const destPath = path.join(extensionsDest, file);
        fs.copyFileSync(sourcePath, destPath);
      });
    }
  }

  /**
   * Erstellt ein Start-Skript für die Umgebung
   * Creates a start script for the environment
   */
  createStartScript(buildDir, environment) {
    const scriptContent = `#!/bin/bash
# Start-Skript für Scratch Collaboration Server (${environment})

echo "Starte Scratch Collaboration Server in ${environment} Umgebung..."
echo "Starting Scratch Collaboration Server in ${environment} environment..."

# Setze Umgebungsvariable
export NODE_ENV=${environment}

# Installiere Dependencies falls nötig
if [ ! -d "node_modules" ]; then
    echo "Installiere Dependencies..."
    echo "Installing dependencies..."
    npm install
fi

# Starte Server
echo "Starte Server..."
echo "Starting server..."
node server-extended.js
`;

    const scriptPath = path.join(buildDir, 'start.sh');
    fs.writeFileSync(scriptPath, scriptContent);

    // Mache Skript ausführbar (Unix/Linux/Mac)
    try {
      fs.chmodSync(scriptPath, '755');
    } catch (error) {
      // Ignoriere Fehler auf Windows
    }
  }

  /**
   * Erstellt Dockerfile für Docker-Bereitstellung
   * Creates Dockerfile for Docker deployment
   */
  createDockerfile(buildDir, environment) {
    const dockerfileContent = `FROM node:18-alpine

# Setze Arbeitsverzeichnis
WORKDIR /app

# Kopiere Package-Dateien
COPY package*.json ./

# Installiere Dependencies
RUN npm ci --only=production

# Kopiere Server-Dateien
COPY server-extended.js .
COPY config.json .
COPY extensions/ ./extensions/

# Erstelle Log-Verzeichnis
RUN mkdir -p logs

# Exponiere Port
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "const http=require('http');const req=http.request({hostname:'localhost',port:3000,path:'/health'},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Setze Umgebungsvariable
ENV NODE_ENV=${environment}

# Starte Server
CMD ["node", "server-extended.js"]
`;

    const dockerfilePath = path.join(buildDir, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('    ✓ Dockerfile');
  }

  /**
   * Generiert Dokumentation
   * Generates documentation
   */
  generateDocumentation(options) {
    console.log('\n📚 Generiere Dokumentation...');

    // API Dokumentation
    const apiDocs = this.generateApiDocumentation();
    fs.writeFileSync(path.join(this.docsDir, 'api', 'README.md'), apiDocs);

    // Setup Anleitung
    const setupDocs = this.generateSetupDocumentation(options);
    fs.writeFileSync(path.join(this.docsDir, 'SETUP.md'), setupDocs);

    // Erweiterungs-Dokumentation
    const extensionDocs = this.generateExtensionDocumentation();
    fs.writeFileSync(path.join(this.docsDir, 'EXTENSIONS.md'), extensionDocs);

    console.log('    ✓ API documentation');
    console.log('    ✓ Setup guide');
    console.log('    ✓ Extension documentation');
  }

  /**
   * Setup für Tests
   * Setup for testing
   */
  setupTesting(options) {
    if (!options.testing) return;

    console.log('\n🧪 Setup für Tests...');

    // Erstelle Test-Dateien
    const testFiles = {
      'server.test.js': this.getServerTestContent(),
      'api.test.js': this.getApiTestContent(),
      'websocket.test.js': this.getWebSocketTestContent()
    };

    Object.entries(testFiles).forEach(([file, content]) => {
      const filePath = path.join(this.serverDir, 'tests', file);
      fs.writeFileSync(filePath, content);
      console.log(`    ✓ tests/${file}`);
    });

    // Aktualisiere package.json für Tests
    this.updatePackageJsonForTesting();
  }

  /**
   * Aktualisiert package.json für Tests
   * Updates package.json for testing
   */
  updatePackageJsonForTesting() {
    const packagePath = path.join(this.serverDir, 'package.json');

    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.test = 'jest';
      packageJson.scripts['test:watch'] = 'jest --watch';
      packageJson.scripts['test:coverage'] = 'jest --coverage';

      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies.jest = '^29.0.0';
      packageJson.devDependencies['supertest'] = '^6.0.0';

      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('    ✓ Updated package.json with test scripts');
    }
  }

  // Weitere Methoden für Content-Generierung folgen...
  // More methods for content generation follow...

  /**
   * Gibt den Inhalt für die Monitoring-Erweiterung zurück
   * Returns content for monitoring extension
   */
  getMonitoringExtensionContent() {
    return `'use strict';

const os = require('os');
const v8 = require('v8');

class ServerMonitor {
  constructor(server, config = {}) {
    this.server = server;
    this.config = {
      interval: config.interval || 30000,
      enabled: config.enabled !== false,
      ...config
    };

    this.metrics = {
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      websocketConnections: 0,
      activeSessions: 0
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  startMonitoring() {
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);

    console.log('📊 Server monitoring started');
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.metrics = {
      ...this.metrics,
      timestamp: Date.now(),
      uptime: process.uptime(),
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      systemMemory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      loadAverage: os.loadavg(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Log metrics periodically
    if (this.shouldLogMetrics()) {
      console.log('📊 Server Metrics:', JSON.stringify(this.metrics, null, 2));
    }
  }

  shouldLogMetrics() {
    // Log every 5 minutes in production, every minute in development
    const logInterval = process.env.NODE_ENV === 'production' ? 300000 : 60000;
    return Math.floor(Date.now() / logInterval) % (logInterval / this.config.interval) === 0;
  }

  incrementRequests() {
    this.metrics.requests++;
  }

  incrementErrors() {
    this.metrics.errors++;
  }

  updateWebSocketConnections(count) {
    this.metrics.websocketConnections = count;
  }

  updateActiveSessions(count) {
    this.metrics.activeSessions = count;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('📊 Server monitoring stopped');
    }
  }
}

module.exports = ServerMonitor;
`;
  }

  /**
   * Gibt den Inhalt für die Health-Check-Erweiterung zurück
   * Returns content for health check extension
   */
  getHealthCheckExtensionContent() {
    return `'use strict';

class HealthChecker {
  constructor(server) {
    this.server = server;
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  registerDefaultChecks() {
    // Memory usage check
    this.registerCheck('memory', () => {
      const memUsage = process.memoryUsage();
      const threshold = 100 * 1024 * 1024; // 100MB

      return {
        status: memUsage.heapUsed < threshold ? 'healthy' : 'warning',
        message: \`Heap usage: \${Math.round(memUsage.heapUsed / 1024 / 1024)}MB\`,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          threshold
        }
      };
    });

    // WebSocket connections check
    this.registerCheck('websocket', () => {
      const connectionCount = this.server.wss ? this.server.wss.clients.size : 0;

      return {
        status: connectionCount >= 0 ? 'healthy' : 'error',
        message: \`Active connections: \${connectionCount}\`,
        details: { connectionCount }
      };
    });

    // Active sessions check
    this.registerCheck('sessions', () => {
      const sessionCount = this.server.collaborationSessions ?
        this.server.collaborationSessions.size : 0;

      return {
        status: 'healthy',
        message: \`Active sessions: \${sessionCount}\`,
        details: { sessionCount }
      };
    });
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async performHealthCheck() {
    const results = {};
    const overallStatus = { healthy: 0, warning: 0, error: 0 };

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const result = await checkFn();
        results[name] = result;

        if (result.status) {
          overallStatus[result.status]++;
        }
      } catch (error) {
        results[name] = {
          status: 'error',
          message: \`Check failed: \${error.message}\`,
          error: error.message
        };
        overallStatus.error++;
      }
    }

    // Determine overall health
    let status = 'healthy';
    if (overallStatus.error > 0) {
      status = 'error';
    } else if (overallStatus.warning > 0) {
      status = 'warning';
    }

    return {
      status,
      timestamp: Date.now(),
      uptime: process.uptime(),
      checks: results,
      summary: overallStatus
    };
  }

  getHealthCheckEndpoint() {
    return async (req, res) => {
      try {
        const healthResult = await this.performHealthCheck();

        const statusCode = healthResult.status === 'healthy' ? 200 :
                          healthResult.status === 'warning' ? 200 : 503;

        res.status(statusCode).json(healthResult);
      } catch (error) {
        res.status(503).json({
          status: 'error',
          timestamp: Date.now(),
          message: 'Health check failed',
          error: error.message
        });
      }
    };
  }
}

module.exports = HealthChecker;
`;
  }

  /**
   * Gibt den Inhalt für die API-Erweiterungen zurück
   * Returns content for API extensions
   */
  getApiExtensionsContent() {
    return `'use strict';

class ApiExtensions {
  constructor(server) {
    this.server = server;
    this.setupRoutes();
  }

  setupRoutes() {
    const app = this.server.app;

    // Project statistics endpoint
    app.get('/api/projects/:projectId/stats', (req, res) => {
      this.getProjectStats(req, res);
    });

    // User activity endpoint
    app.get('/api/users/activity', (req, res) => {
      this.getUserActivity(req, res);
    });

    // Server metrics endpoint
    app.get('/api/metrics', (req, res) => {
      this.getServerMetrics(req, res);
    });

    // Export session data
    app.get('/api/sessions/:projectId/export', (req, res) => {
      this.exportSessionData(req, res);
    });

    console.log('🔌 API extensions loaded');
  }

  getProjectStats(req, res) {
    const { projectId } = req.params;

    if (!this.server.collaborationSessions.has(projectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const session = this.server.collaborationSessions.get(projectId);
    const now = Date.now();

    const stats = {
      projectId,
      participantCount: session.participants.size,
      sessionDuration: now - session.created,
      participants: Array.from(session.participants.values()).map(p => ({
        userName: p.userName,
        joinedAt: p.joinedAt,
        duration: now - p.joinedAt,
        isAuthenticated: p.isAuthenticated
      })),
      created: session.created
    };

    res.json(stats);
  }

  getUserActivity(req, res) {
    const activityData = [];

    this.server.collaborationSessions.forEach((session, projectId) => {
      session.participants.forEach((participant) => {
        activityData.push({
          projectId,
          userName: participant.userName,
          joinedAt: participant.joinedAt,
          duration: Date.now() - participant.joinedAt,
          isAuthenticated: participant.isAuthenticated
        });
      });
    });

    // Group by user and calculate total activity time
    const userStats = activityData.reduce((acc, curr) => {
      if (!acc[curr.userName]) {
        acc[curr.userName] = {
          userName: curr.userName,
          totalSessions: 0,
          totalTime: 0,
          projects: [],
          isAuthenticated: curr.isAuthenticated
        };
      }

      acc[curr.userName].totalSessions++;
      acc[curr.userName].totalTime += curr.duration;
      acc[curr.userName].projects.push(projectId);

      return acc;
    }, {});

    res.json({
      users: Object.values(userStats),
      totalUsers: Object.keys(userStats).length,
      timestamp: Date.now()
    });
  }

  getServerMetrics(req, res) {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      sessions: this.server.collaborationSessions.size,
      connections: this.server.wss ? this.server.wss.clients.size : 0,
      timestamp: Date.now()
    };

    res.json(metrics);
  }

  exportSessionData(req, res) {
    const { projectId } = req.params;

    if (!this.server.collaborationSessions.has(projectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const session = this.server.collaborationSessions.get(projectId);
    const exportData = {
      projectId,
      created: session.created,
      participants: Array.from(session.participants.values()).map(p => ({
        userName: p.userName,
        joinedAt: p.joinedAt,
        isAuthenticated: p.isAuthenticated,
        profile: p.profile
      })),
      exportedAt: Date.now()
    };

    res.json(exportData);
  }
}

module.exports = ApiExtensions;
`;
  }

  /**
   * Gibt den Inhalt für den Rate Limiter zurück
   * Returns content for rate limiter
   */
  getRateLimiterContent() {
    return `'use strict';

class RateLimiter {
  constructor(config = {}) {
    this.config = {
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 Minuten
      max: config.max || 100, // Limit pro Fenster
      enabled: config.enabled !== false,
      ...config
    };

    this.requests = new Map();
    this.startCleanupInterval();
  }

  startCleanupInterval() {
    // Cleanup alte Einträge alle 5 Minuten
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      // Entferne Requests älter als windowMs
      const validRequests = requests.filter(timestamp => now - timestamp < this.config.windowMs);

      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  isRateLimited(identifier) {
    if (!this.config.enabled) {
      return false;
    }

    const now = Date.now();
    const key = identifier || 'anonymous';

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);

    // Entferne alte Requests
    const validRequests = requests.filter(timestamp => now - timestamp < this.config.windowMs);

    if (validRequests.length >= this.config.max) {
      return true;
    }

    // Füge neuen Request hinzu
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return false;
  }

  getRemainingRequests(identifier) {
    if (!this.config.enabled) {
      return this.config.max;
    }

    const now = Date.now();
    const key = identifier || 'anonymous';

    if (!this.requests.has(key)) {
      return this.config.max;
    }

    const requests = this.requests.get(key);
    const validRequests = requests.filter(timestamp => now - timestamp < this.config.windowMs);

    return Math.max(0, this.config.max - validRequests.length);
  }

  getResetTime(identifier) {
    if (!this.config.enabled) {
      return Date.now();
    }

    const now = Date.now();
    const key = identifier || 'anonymous';

    if (!this.requests.has(key)) {
      return now;
    }

    const requests = this.requests.get(key);
    if (requests.length === 0) {
      return now;
    }

    // Finde den ältesten Request und addiere windowMs
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.config.windowMs;
  }

  middleware() {
    return (req, res, next) => {
      const identifier = req.ip || req.connection.remoteAddress || 'anonymous';

      if (this.isRateLimited(identifier)) {
        const resetTime = this.getResetTime(identifier);
        const remainingTime = Math.ceil((resetTime - Date.now()) / 1000);

        return res.status(429).json({
          error: 'Too Many Requests',
          message: \`Rate limit exceeded. Try again in \${remainingTime} seconds.\`,
          retryAfter: remainingTime,
          limit: this.config.max,
          windowMs: this.config.windowMs
        });
      }

      // Füge Rate Limit Headers hinzu
      res.set({
        'X-RateLimit-Limit': this.config.max,
        'X-RateLimit-Remaining': this.getRemainingRequests(identifier),
        'X-RateLimit-Reset': new Date(this.getResetTime(identifier)).toISOString()
      });

      next();
    };
  }
}

module.exports = RateLimiter;
`;
  }

  /**
   * Gibt den Inhalt für den Logger zurück
   * Returns content for logger
   */
  getLoggerExtensionContent() {
    return `'use strict';

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || 'info',
      file: config.file || './logs/server.log',
      console: config.console !== false,
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      ...config
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.config.file);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.config.level];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;

    return JSON.stringify({
      timestamp,
      level,
      pid,
      message,
      ...meta
    });
  }

  writeToFile(message) {
    try {
      // Prüfe Dateigröße und rotiere falls nötig
      if (fs.existsSync(this.config.file)) {
        const stats = fs.statSync(this.config.file);
        if (stats.size > this.config.maxSize) {
          this.rotateLogFile();
        }
      }

      fs.appendFileSync(this.config.file, message + '\\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  rotateLogFile() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = this.config.file.replace('.log', \`-\${timestamp}.log\`);

      if (fs.existsSync(this.config.file)) {
        fs.renameSync(this.config.file, rotatedFile);
      }

      // Cleanup alte Dateien
      this.cleanupOldFiles();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  cleanupOldFiles() {
    try {
      const logDir = path.dirname(this.config.file);
      const baseName = path.basename(this.config.file, '.log');

      const files = fs.readdirSync(logDir)
        .filter(file => file.startsWith(baseName + '-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          timestamp: fs.statSync(path.join(logDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      // Lösche alte Dateien über dem Limit
      if (files.length >= this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles - 1);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old log files:', error);
    }
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);

    if (this.config.console) {
      const consoleMessage = \`[\${level.toUpperCase()}] \${message}\`;
      console.log(consoleMessage);
    }

    this.writeToFile(formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Middleware für HTTP Request Logging
  requestLoggingMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);

      this.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.info('Request completed', {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: \`\${duration}ms\`
        });
      });

      next();
    };
  }
}

module.exports = Logger;
`;
  }

  /**
   * Gibt den Inhalt für das Audit-Log zurück
   * Returns content for audit log
   */
  getAuditLogContent() {
    return `'use strict';

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(config = {}) {
    this.config = {
      file: config.file || './logs/audit.log',
      enabled: config.enabled !== false,
      ...config
    };

    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.config.file);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatAuditEntry(action, details = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;

    return JSON.stringify({
      timestamp,
      pid,
      type: 'audit',
      action,
      ...details
    });
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.config.file, message + '\\n');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  log(action, details = {}) {
    if (!this.config.enabled) {
      return;
    }

    const entry = this.formatAuditEntry(action, details);
    this.writeToFile(entry);

    console.log(\`[AUDIT] \${action}\`, details);
  }

  // Audit-Events für verschiedene Aktionen
  logUserAuthentication(user, success, details = {}) {
    this.log('user_authentication', {
      user: user.username || user.userName,
      success,
      userId: user.userId,
      ip: details.ip,
      userAgent: details.userAgent
    });
  }

  logProjectAccess(projectId, user, action, details = {}) {
    this.log('project_access', {
      projectId,
      user: user.username || user.userName,
      action,
      ip: details.ip
    });
  }

  logSessionCreation(projectId, user, details = {}) {
    this.log('session_creation', {
      projectId,
      user: user.username || user.userName,
      ip: details.ip
    });
  }

  logSessionTermination(projectId, user, details = {}) {
    this.log('session_termination', {
      projectId,
      user: user.username || user.userName,
      ip: details.ip
    });
  }

  logDataExport(projectId, user, details = {}) {
    this.log('data_export', {
      projectId,
      user: user.username || user.userName,
      exportType: details.exportType,
      ip: details.ip
    });
  }

  logConfigurationChange(change, user, details = {}) {
    this.log('configuration_change', {
      change,
      user: user.username || user.userName,
      ip: details.ip,
      previousValue: details.previousValue,
      newValue: details.newValue
    });
  }

  logSecurityEvent(event, severity, details = {}) {
    this.log('security_event', {
      event,
      severity,
      ...details
    });
  }
}

module.exports = AuditLogger;
`;
  }

  /**
   * Gibt den Inhalt für den erweiterten Server zurück
   * Returns content for extended server
   */
  getExtendedServerContent(options) {
    const extensions = options.extensions || ['monitoring', 'api', 'logging'];

    let content = `'use strict';

// Erweiterter Scratch Collaboration Server
// Extended Scratch Collaboration Server

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Lade Konfiguration
const configPath = path.join(__dirname, 'config.json');
let config = {};

try {
  if (require('fs').existsSync(configPath)) {
    config = require(configPath);
  } else {
    console.warn('⚠️  config.json not found, using default configuration');
    config = {
      port: 3000,
      environment: 'development',
      logging: { level: 'info' },
      cors: { origin: ['http://localhost:3000'] }
    };
  }
} catch (error) {
  console.error('❌ Error loading config:', error.message);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware Setup
if (config.security && config.security.helmet) {
  app.use(helmet());
}

app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));

// Lade Erweiterungen
console.log('🔌 Loading extensions...');

let logger, monitor, healthChecker, rateLimiter, apiExtensions, auditLogger;

try {
`;

    // Füge Erweiterungs-Imports hinzu
    if (extensions.includes('logging')) {
      content += `
// Logger Extension
const Logger = require('./extensions/logger');
logger = new Logger(config.logging);
app.use(logger.requestLoggingMiddleware());

// Audit Logger
const AuditLogger = require('./extensions/audit-log');
auditLogger = new AuditLogger(config.audit);
`;
    }

    if (extensions.includes('monitoring')) {
      content += `
// Monitoring Extension
const ServerMonitor = require('./extensions/monitoring');
monitor = new ServerMonitor({ server, wss, collaborationSessions, config: config.monitoring });

// Health Check Extension
const HealthChecker = require('./extensions/health-check');
healthChecker = new HealthChecker({ server, wss, collaborationSessions });
`;
    }

    if (extensions.includes('api')) {
      content += `
// Rate Limiter
const RateLimiter = require('./extensions/rate-limiter');
rateLimiter = new RateLimiter(config.rateLimiting);
app.use(rateLimiter.middleware());

// API Extensions
const ApiExtensions = require('./extensions/api-extensions');
apiExtensions = new ApiExtensions({ server, wss, collaborationSessions, config });
`);
    }

    content += `
// Store active collaboration sessions
const collaborationSessions = new Map();

// Store authenticated Scratch users
const scratchUsers = new Map();

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  const clientId = uuidv4();
  ws.clientId = clientId;

  // Log connection
  if (logger) {
    logger.info('WebSocket connection established', {
      clientId,
      ip: request.socket.remoteAddress
    });
  }

  if (monitor) {
    monitor.updateWebSocketConnections(wss.clients.size);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(ws, data);
    } catch (error) {
      if (logger) {
        logger.error('Error parsing WebSocket message', { error: error.message, clientId });
      }

      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    if (logger) {
      logger.info('WebSocket connection closed', { clientId });
    }

    handleClientDisconnect(ws);

    if (monitor) {
      monitor.updateWebSocketConnections(wss.clients.size);
    }
  });

  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    timestamp: Date.now()
  }));
});

// Enhanced WebSocket message handler
function handleWebSocketMessage(ws, data) {
  const { type, projectId, userName, clientId, scratchAuth } = data;

  // Log message
  if (logger) {
    logger.debug('WebSocket message received', {
      type,
      clientId: ws.clientId,
      projectId
    });
  }

  switch (type) {
    case 'join':
      handleJoinProject(ws, data);
      break;

    case 'authenticate':
      handleUserAuthentication(ws, data);
      break;

    case 'leave':
      handleLeaveProject(ws, data);
      break;

    case 'projectUpdate':
      handleProjectUpdate(ws, data);
      break;

    case 'cursorMove':
      handleCursorMove(ws, data);
      break;

    case 'chatMessage':
      handleChatMessage(ws, data);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: \`Unknown message type: \${type}\`
      }));
  }
}

// Enhanced user authentication with audit logging
function handleUserAuthentication(ws, data) {
  const { scratchAuth } = data;

  if (scratchAuth && scratchAuth.isLoggedIn) {
    scratchUsers.set(ws.clientId, {
      clientId: ws.clientId,
      username: scratchAuth.username,
      userId: scratchAuth.userId,
      avatar: scratchAuth.avatar,
      profileUrl: scratchAuth.profileUrl,
      authenticatedAt: Date.now()
    });

    ws.isAuthenticated = true;
    ws.scratchUser = scratchAuth;

    if (logger) {
      logger.info('User authenticated', { username: scratchAuth.username });
    }

    if (auditLogger) {
      auditLogger.logUserAuthentication(scratchAuth, true, {
        ip: ws._socket.remoteAddress
      });
    }

    ws.send(JSON.stringify({
      type: 'authenticated',
      success: true,
      username: scratchAuth.username,
      timestamp: Date.now()
    }));
  } else {
    if (auditLogger) {
      auditLogger.logUserAuthentication({}, false, {
        ip: ws._socket.remoteAddress,
        reason: 'Invalid authentication data'
      });
    }

    ws.send(JSON.stringify({
      type: 'authenticated',
      success: false,
      message: 'Invalid authentication data',
      timestamp: Date.now()
    }));
  }
}

// Enhanced project joining with audit logging
function handleJoinProject(ws, data) {
  const { projectId, userName, scratchAuth } = data;

  if (!projectId || !userName) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Project ID and user name are required'
    }));
    return;
  }

  if (!collaborationSessions.has(projectId)) {
    collaborationSessions.set(projectId, {
      projectId,
      participants: new Map(),
      created: Date.now()
    });

    if (logger) {
      logger.info('New collaboration session created', { projectId });
    }

    if (auditLogger) {
      auditLogger.logSessionCreation(projectId, { userName }, {
        ip: ws._socket.remoteAddress
      });
    }
  }

  const session = collaborationSessions.get(projectId);

  let displayName = userName;
  let userProfile = null;

  if (ws.isAuthenticated && ws.scratchUser) {
    displayName = ws.scratchUser.username;
    userProfile = {
      username: ws.scratchUser.username,
      avatar: ws.scratchUser.avatar,
      profileUrl: ws.scratchUser.profileUrl
    };
  }

  session.participants.set(ws.clientId, {
    clientId: ws.clientId,
    userName: displayName,
    ws,
    joinedAt: Date.now(),
    profile: userProfile,
    isAuthenticated: ws.isAuthenticated || false
  });

  ws.projectId = projectId;
  ws.userName = displayName;

  if (logger) {
    logger.info('User joined project', {
      projectId,
      userName: displayName,
      participantCount: session.participants.size
    });
  }

  if (auditLogger) {
    auditLogger.logProjectAccess(projectId, { userName: displayName }, 'join', {
      ip: ws._socket.remoteAddress
    });
  }

  broadcastToProject(projectId, {
    type: 'userJoined',
    userName: displayName,
    clientId: ws.clientId,
    participantCount: session.participants.size,
    profile: userProfile,
    timestamp: Date.now()
  }, ws.clientId);

  const participantsList = Array.from(session.participants.values()).map(p => ({
    clientId: p.clientId,
    userName: p.userName,
    joinedAt: p.joinedAt,
    profile: p.profile,
    isAuthenticated: p.isAuthenticated
  }));

  ws.send(JSON.stringify({
    type: 'participantsList',
    participants: participantsList,
    timestamp: Date.now()
  }));

  ws.send(JSON.stringify({
    type: 'joined',
    projectId,
    participantCount: session.participants.size,
    timestamp: Date.now()
  }));

  if (monitor) {
    monitor.updateActiveSessions(collaborationSessions.size);
  }
}

// Enhanced project leaving with audit logging
function handleLeaveProject(ws, data) {
  const { projectId } = data;
  const sessionProjectId = projectId || ws.projectId;

  if (sessionProjectId && collaborationSessions.has(sessionProjectId)) {
    const session = collaborationSessions.get(sessionProjectId);

    if (session.participants.has(ws.clientId)) {
      const participant = session.participants.get(ws.clientId);
      const userName = participant.userName;

      session.participants.delete(ws.clientId);

      if (logger) {
        logger.info('User left project', {
          projectId: sessionProjectId,
          userName,
          remainingParticipants: session.participants.size
        });
      }

      if (auditLogger) {
        auditLogger.logProjectAccess(sessionProjectId, { userName }, 'leave', {
          ip: ws._socket.remoteAddress
        });
      }

      if (session.participants.size === 0) {
        collaborationSessions.delete(sessionProjectId);

        if (logger) {
          logger.info('Collaboration session removed', { projectId: sessionProjectId });
        }

        if (auditLogger) {
          auditLogger.logSessionTermination(sessionProjectId, { userName }, {
            ip: ws._socket.remoteAddress
          });
        }
      } else {
        broadcastToProject(sessionProjectId, {
          type: 'userLeft',
          userName,
          clientId: ws.clientId,
          participantCount: session.participants.size,
          timestamp: Date.now()
        });
      }
    }
  }

  if (monitor) {
    monitor.updateActiveSessions(collaborationSessions.size);
  }
}

// Enhanced project updates
function handleProjectUpdate(ws, data) {
  const { projectId, updateData } = data;

  if (!ws.projectId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not joined to any project'
    }));
    return;
  }

  if (logger) {
    logger.debug('Project update received', {
      projectId: ws.projectId,
      userName: ws.userName,
      updateType: updateData.type
    });
  }

  broadcastToProject(ws.projectId, {
    type: 'projectUpdate',
    userName: ws.userName,
    clientId: ws.clientId,
    data: updateData,
    timestamp: Date.now()
  }, ws.clientId);
}

// Enhanced cursor movements
function handleCursorMove(ws, data) {
  const { projectId, position } = data;

  if (!ws.projectId) {
    return;
  }

  broadcastToProject(ws.projectId, {
    type: 'cursorMove',
    userName: ws.userName,
    clientId: ws.clientId,
    position,
    timestamp: Date.now()
  }, ws.clientId);
}

// Enhanced chat messages
function handleChatMessage(ws, data) {
  const { projectId, message } = data;

  if (!ws.projectId || !message || message.trim() === '') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Project ID and message are required'
    }));
    return;
  }

  if (logger) {
    logger.info('Chat message', {
      projectId: ws.projectId,
      userName: ws.userName,
      messageLength: message.length
    });
  }

  broadcastToProject(ws.projectId, {
    type: 'chatMessage',
    userName: ws.userName,
    clientId: ws.clientId,
    message: message.trim(),
    timestamp: Date.now()
  });
}

// Enhanced client disconnect handling
function handleClientDisconnect(ws) {
  if (ws.projectId && collaborationSessions.has(ws.projectId)) {
    handleLeaveProject(ws, { projectId: ws.projectId });
  }
}

// Broadcast message to all participants in a project except sender
function broadcastToProject(projectId, message, excludeClientId = null) {
  if (!collaborationSessions.has(projectId)) {
    return;
  }

  const session = collaborationSessions.get(projectId);
  const messageStr = JSON.stringify(message);

  session.participants.forEach((participant, clientId) => {
    if (clientId !== excludeClientId && participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(messageStr);
    }
  });
}

// REST API Endpoints
app.get('/api/sessions', (req, res) => {
  if (rateLimiter && rateLimiter.isRateLimited(req.ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const sessions = Array.from(collaborationSessions.entries()).map(([projectId, session]) => ({
    projectId,
    participantCount: session.participants.size,
    created: session.created
  }));

  res.json({
    sessions,
    totalSessions: sessions.length,
    timestamp: Date.now()
  });
});

app.get('/api/sessions/:projectId', (req, res) => {
  if (rateLimiter && rateLimiter.isRateLimited(req.ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { projectId } = req.params;

  if (!collaborationSessions.has(projectId)) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  const session = collaborationSessions.get(projectId);
  const participants = Array.from(session.participants.values()).map(p => ({
    clientId: p.clientId,
    userName: p.userName,
    joinedAt: p.joinedAt
  }));

  res.json({
    projectId,
    participants,
    participantCount: participants.length,
    created: session.created,
    timestamp: Date.now()
  });
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    let healthResult = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: config.environment,
      version: process.version
    };

    if (healthChecker) {
      const detailedHealth = await healthChecker.performHealthCheck();
      healthResult = { ...healthResult, ...detailedHealth };
    }

    if (monitor) {
      healthResult.metrics = monitor.getMetrics();
    }

    const statusCode = healthResult.status === 'healthy' ? 200 :
                      healthResult.status === 'warning' ? 200 : 503;

    res.status(statusCode).json(healthResult);
  } catch (error) {
    if (logger) {
      logger.error('Health check failed', { error: error.message });
    }

    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Start server
const PORT = config.port || process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(\`🚀 Scratch Collaboration Server (\${config.environment}) running on port \${PORT}\`);
  console.log(\`🔗 WebSocket endpoint: ws://localhost:\${PORT}\`);
  console.log(\`🔗 API endpoint: http://localhost:\${PORT}/api\`);
  console.log(\`🔗 Health endpoint: http://localhost:\${PORT}/health\`);

  if (config.environment === 'production') {
    console.log(\`🔒 Running in production mode\`);
  }

  if (logger) {
    logger.info('Server started', {
      port: PORT,
      environment: config.environment,
      extensions: ${JSON.stringify(extensions)}
    });
  }
});

// Enhanced graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');

  if (logger) {
    logger.info('Server shutdown initiated');
  }

  if (auditLogger) {
    auditLogger.logSecurityEvent('server_shutdown', 'info', {
      signal: 'SIGINT'
    });
  }

  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close();
  });

  server.close(() => {
    console.log('✅ Server closed');

    if (monitor) {
      monitor.stopMonitoring();
    }

    if (logger) {
      logger.info('Server shutdown completed');
    }

    process.exit(0);
  });
});

module.exports = { app, server, wss, collaborationSessions, scratchUsers };
`;

    return content;
  }

  /**
   * Generiert API-Dokumentation
   * Generates API documentation
   */
  generateApiDocumentation() {
    return `# Scratch Collaboration Server API

Eine umfassende REST API für den Scratch Collaboration Server mit erweiterten Features.

## Übersicht

Der erweiterte Server bietet zusätzliche Endpunkte für Monitoring, Statistiken und Datenexport.

## Basis-Endpunkte

### Health Check
\`GET /health\`

Gibt den Gesundheitsstatus des Servers zurück.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": 1634567890123,
  "uptime": 123.456,
  "environment": "production",
  "checks": {
    "memory": {
      "status": "healthy",
      "message": "Heap usage: 45MB"
    },
    "websocket": {
      "status": "healthy",
      "message": "Active connections: 12"
    }
  }
}
\`\`\`

### Aktive Sessions
\`GET /api/sessions\`

Listet alle aktiven Kollaborations-Sessions auf.

**Response:**
\`\`\`json
{
  "sessions": [
    {
      "projectId": "123456789",
      "participantCount": 3,
      "created": 1634567890123
    }
  ],
  "totalSessions": 1,
  "timestamp": 1634567890123
}
\`\`\`

### Session Details
\`GET /api/sessions/{projectId}\`

Gibt detaillierte Informationen über eine spezifische Session zurück.

**Response:**
\`\`\`json
{
  "projectId": "123456789",
  "participants": [
    {
      "clientId": "abc123",
      "userName": "user1",
      "joinedAt": 1634567890123
    }
  ],
  "participantCount": 1,
  "created": 1634567890123,
  "timestamp": 1634567890123
}
\`\`\`

## Erweiterte Endpunkte

### Projekt-Statistiken
\`GET /api/projects/{projectId}/stats\`

Gibt Statistiken für ein spezifisches Projekt zurück.

**Response:**
\`\`\`json
{
  "projectId": "123456789",
  "participantCount": 3,
  "sessionDuration": 3600000,
  "participants": [
    {
      "userName": "user1",
      "joinedAt": 1634567890123,
      "duration": 1800000,
      "isAuthenticated": true
    }
  ],
  "created": 1634567890123
}
\`\`\`

### Benutzer-Aktivität
\`GET /api/users/activity\`

Gibt eine Übersicht über die Aktivität aller Benutzer zurück.

**Response:**
\`\`\`json
{
  "users": [
    {
      "userName": "user1",
      "totalSessions": 2,
      "totalTime": 7200000,
      "projects": ["123456789", "987654321"],
      "isAuthenticated": true
    }
  ],
  "totalUsers": 1,
  "timestamp": 1634567890123
}
\`\`\`

### Server-Metriken
\`GET /api/metrics\`

Gibt detaillierte Server-Metriken zurück.

**Response:**
\`\`\`json
{
  "uptime": 123.456,
  "memory": {
    "rss": 50331648,
    "heapTotal": 49152000,
    "heapUsed": 23456789
  },
  "cpu": {
    "user": 123456,
    "system": 78901
  },
  "sessions": 5,
  "connections": 12,
  "timestamp": 1634567890123
}
\`\`\`

### Session-Daten Export
\`GET /api/sessions/{projectId}/export\`

Exportiert alle Daten einer Session für Backup oder Analyse.

**Response:**
\`\`\`json
{
  "projectId": "123456789",
  "created": 1634567890123,
  "participants": [
    {
      "userName": "user1",
      "joinedAt": 1634567890123,
      "isAuthenticated": true,
      "profile": {
        "username": "scratchuser1",
        "avatar": "https://...",
        "profileUrl": "https://..."
      }
    }
  ],
  "exportedAt": 1634567890123
}
\`\`\`

## WebSocket Events

### Erweiterte Events

Neben den Standard-Events werden zusätzliche Events unterstützt:

#### Server-Metriken Update
\`\`\`json
{
  "type": "serverMetrics",
  "metrics": {
    "activeUsers": 15,
    "memoryUsage": 67.5,
    "uptime": "2h 30m"
  },
  "timestamp": 1634567890123
}
\`\`\`

#### Session-Statistiken
\`\`\`json
{
  "type": "sessionStats",
  "projectId": "123456789",
  "stats": {
    "messagesSent": 45,
    "participantsJoined": 8,
    "averageSessionTime": 1800000
  },
  "timestamp": 1634567890123
}
\`\`\`

## Rate Limiting

Der Server implementiert Rate Limiting für API-Endpunkte:

- **Window**: 15 Minuten
- **Max Requests**: 100 pro IP
- **Headers**:
  - \`X-RateLimit-Limit\`: Maximum requests pro window
  - \`X-RateLimit-Remaining\`: Verbleibende requests
  - \`X-RateLimit-Reset\`: Zeitstempel für Reset

## Fehler-Codes

- \`200\`: Erfolg
- \`400\`: Bad Request
- \`404\`: Nicht gefunden
- \`429\`: Rate limit überschritten
- \`500\`: Interner Server-Fehler
- \`503\`: Service nicht verfügbar

## Authentifizierung

Für authentifizierte Anfragen wird Scratch-Authentifizierung unterstützt:

\`\`\`json
{
  "type": "authenticate",
  "scratchAuth": {
    "isLoggedIn": true,
    "username": "scratchuser",
    "userId": 12345,
    "avatar": "https://...",
    "profileUrl": "https://..."
  }
}
\`\`\`
`;
  }

  /**
   * Generiert Setup-Dokumentation
   * Generates setup documentation
   */
  generateSetupDocumentation(options) {
    return `# Scratch Collaboration Server Setup Guide

Dieses Dokument beschreibt die Installation und Konfiguration des erweiterten Scratch Collaboration Servers.

## Voraussetzungen

- Node.js 14.0.0 oder höher
- npm oder yarn
- Git (optional)

## Schnellstart

### 1. Repository klonen
\`\`\`bash
git clone https://github.com/r4k5O/ScratchCollab.git
cd ScratchCollab
\`\`\`

### 2. Dependencies installieren
\`\`\`bash
npm install
\`\`\`

### 3. Server erweitern und bauen
\`\`\`bash
node server-extension-builder.js --extensions monitoring,api,logging --environments development,production --docker --testing
\`\`\`

### 4. Server starten
\`\`\`bash
cd server/dist/development
chmod +x start.sh
./start.sh
\`\`\`

## Erweiterte Konfiguration

### Verfügbare Erweiterungen

#### Monitoring
- Server-Metriken und Gesundheitsprüfungen
- Automatische Ressourcen-Überwachung
- Performance-Statistiken

#### API Extensions
- Zusätzliche REST-Endpunkte
- Projekt-Statistiken
- Benutzer-Aktivitätsberichte

#### Logging
- Strukturierte Protokollierung
- Audit-Trails
- Log-Rotation

#### Authentication
- JWT-basierte Authentifizierung
- Benutzerverwaltung
- Zugriffskontrolle

### Umgebungen

#### Development
- Debug-Logging aktiviert
- CORS für localhost
- Kein Rate Limiting
- Monitoring aktiviert

#### Production
- Warn-Level Logging
- Eingeschränkte CORS
- Rate Limiting aktiviert
- Erweiterte Sicherheit

#### Test
- Error-Level Logging
- Minimale Konfiguration
- Kein Monitoring
- Schnelle Starts

## Docker-Bereitstellung

### Build und Start
\`\`\`bash
# Baue Docker-Image
docker build -t scratch-collab-server ./server/dist/production

# Starte Container
docker run -d \\
  --name scratch-collab \\
  -p 3000:3000 \\
  -v /logs:/app/logs \\
  scratch-collab-server
\`\`\`

### Docker Compose
\`\`\`yaml
version: '3.8'
services:
  scratch-collab:
    build: ./server/dist/production
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: unless-stopped
\`\`\`

## Konfigurationsdateien

### config/development.json
\`\`\`json
{
  "name": "development",
  "port": 3000,
  "environment": "dev",
  "logging": {
    "level": "debug",
    "file": "./logs/dev.log"
  },
  "cors": {
    "origin": ["http://localhost:3000"],
    "credentials": true
  }
}
\`\`\`

### config/production.json
\`\`\`json
{
  "name": "production",
  "port": 3000,
  "environment": "prod",
  "logging": {
    "level": "warn",
    "file": "./logs/prod.log"
  },
  "cors": {
    "origin": ["https://yourdomain.com"],
    "credentials": true
  },
  "rateLimiting": {
    "enabled": true,
    "windowMs": 900000,
    "max": 100
  }
}
\`\`\`

## Tests

### Unit Tests
\`\`\`bash
cd server
npm test
\`\`\`

### Integration Tests
\`\`\`bash
cd server
npm run test:integration
\`\`\`

### Coverage Report
\`\`\`bash
cd server
npm run test:coverage
\`\`\`

## Monitoring

### Health Check
\`\`\`bash
curl http://localhost:3000/health
\`\`\`

### Metriken
\`\`\`bash
curl http://localhost:3000/api/metrics
\`\`\`

### Aktive Sessions
\`\`\`bash
curl http://localhost:3000/api/sessions
\`\`\`

## Troubleshooting

### Häufige Probleme

#### Port bereits in Benutzung
\`\`\`bash
# Prüfe welcher Prozess den Port verwendet
lsof -i :3000

# Oder ändere den Port in der Konfiguration
\`\`\`

#### WebSocket-Verbindungen funktionieren nicht
- Prüfe CORS-Konfiguration
- Stelle sicher, dass der Server läuft
- Prüfe Firewall-Einstellungen

#### Erweiterungen laden nicht
- Prüfe die Konsole auf Fehler
- Stelle sicher, dass alle Dependencies installiert sind
- Prüfe die config.json-Datei

### Logs

Logs finden sich in:
- Development: \`server/dist/development/logs/\`
- Production: \`server/dist/production/logs/\`
- Audit-Logs: \`server/dist/production/logs/audit.log\`

## Sicherheit

### Rate Limiting
- Standard: 100 Requests pro 15 Minuten pro IP
- Konfigurierbar in \`config/production.json\`

### CORS
- Development: localhost erlaubt
- Production: Nur konfigurierte Domains

### Audit Logging
- Alle Authentifizierungen werden protokolliert
- Projekt-Zugriffe werden getrackt
- Session-Events werden aufgezeichnet

## Performance

### Optimierungen
- Log-Rotation verhindert Speicherprobleme
- WebSocket-Verbindungen werden überwacht
- Memory-Usage wird getrackt

### Skalierung
- Docker-Container für horizontale Skalierung
- Load Balancer für mehrere Instanzen
- Redis für Session-Sharing (zukünftig)

## Support

Bei Problemen oder Fragen:
1. Prüfe die Logs auf Fehlermeldungen
2. Stelle sicher, dass alle Dependencies aktuell sind
3. Teste mit einer minimalen Konfiguration
4. Erstelle ein Issue im GitHub-Repository
`;
  }

  /**
   * Generiert Erweiterungs-Dokumentation
   * Generates extension documentation
   */
  generateExtensionDocumentation() {
    return `# Server-Erweiterungen

Dieses Dokument beschreibt die verfügbaren Erweiterungen für den Scratch Collaboration Server.

## Übersicht

Erweiterungen erweitern die Funktionalität des Servers um zusätzliche Features wie Monitoring, Logging und erweiterte APIs.

## Monitoring Extension

### Features
- Echtzeit-Server-Metriken
- Memory und CPU Usage Tracking
- WebSocket-Verbindungs-Monitoring
- Automatische Gesundheitsprüfungen

### Konfiguration
\`\`\`json
{
  "monitoring": {
    "enabled": true,
    "interval": 30000,
    "metrics": ["memory", "cpu", "connections"]
  }
}
\`\`\`

### API Endpunkte
- \`GET /health\` - Detaillierter Health Check
- \`GET /api/metrics\` - Server-Metriken

## API Extensions

### Features
- Zusätzliche REST-API Endpunkte
- Projekt-Statistiken
- Benutzer-Aktivitätsberichte
- Session-Daten Export

### Neue Endpunkte
- \`GET /api/projects/{id}/stats\` - Projekt-Statistiken
- \`GET /api/users/activity\` - Benutzer-Aktivität
- \`GET /api/sessions/{id}/export\` - Session-Export

## Logging Extension

### Features
- Strukturierte JSON-Logs
- Log-Rotation
- Verschiedene Log-Levels
- Request-Logging Middleware

### Konfiguration
\`\`\`json
{
  "logging": {
    "level": "info",
    "file": "./logs/server.log",
    "console": true,
    "maxSize": "10MB",
    "maxFiles": 5
  }
}
\`\`\`

### Log-Levels
- \`error\`: Fehler
- \`warn\`: Warnungen
- \`info\`: Allgemeine Informationen
- \`debug\`: Debug-Informationen

## Authentication Extension

### Features
- JWT-basierte Authentifizierung
- Benutzerverwaltung
- Zugriffskontrolle
- Session-Management

### Konfiguration
\`\`\`json
{
  "auth": {
    "jwtSecret": "your-secret-key",
    "tokenExpiration": "24h",
    "refreshTokenExpiration": "7d"
  }
}
\`\`\`

## Rate Limiting

### Features
- Konfigurierbares Rate Limiting
- IP-basierte Begrenzung
- Sliding Window Algorithmus
- Rate Limit Headers

### Konfiguration
\`\`\`json
{
  "rateLimiting": {
    "enabled": true,
    "windowMs": 900000,
    "max": 100,
    "skipSuccessfulRequests": false
  }
}
\`\`\`

## Audit Logging

### Features
- Sicherheits-Event-Logging
- Benutzeraktionen-Tracking
- Konfigurationsänderungen
- Datenexport-Events

### Audit-Events
- \`user_authentication\`: Benutzer-Anmeldungen
- \`project_access\`: Projekt-Zugriffe
- \`session_creation\`: Session-Erstellung
- \`data_export\`: Daten-Exporte
- \`configuration_change\`: Konfigurationsänderungen

## Deployment Tools

### Features
- Docker-Image-Generierung
- Start-Skripte für verschiedene Plattformen
- Umgebungs-Konfiguration
- Health-Check-Integration

### Unterstützte Plattformen
- Linux (amd64, arm64)
- macOS (amd64, arm64)
- Windows (amd64)
- Docker-Container

## Installation von Erweiterungen

### Einzelne Erweiterung
\`\`\`bash
node server-extension-builder.js --extensions monitoring
\`\`\`

### Mehrere Erweiterungen
\`\`\`bash
node server-extension-builder.js --extensions monitoring,api,logging,auth
\`\`\`

### Mit Docker-Unterstützung
\`\`\`bash
node server-extension-builder.js --extensions monitoring,api --docker
\`\`\`

## Erweiterungs-API

### Eigenen Extension erstellen

\`\`\`javascript
class MyExtension {
  constructor(server, config = {}) {
    this.server = server;
    this.config = config;
    this.setupRoutes();
  }

  setupRoutes() {
    this.server.app.get('/api/my-endpoint', (req, res) => {
      // Deine Logik hier
      res.json({ message: 'Hello from my extension!' });
    });
  }
}

module.exports = MyExtension;
\`\`\`

### Extension registrieren

Füge die Extension zur Server-Konfiguration hinzu:

\`\`\`json
{
  "extensions": {
    "myExtension": {
      "enabled": true,
      "config": {
        "option1": "value1"
      }
    }
  }
}
\`\`\`

## Troubleshooting

### Extension lädt nicht
1. Prüfe die Konsole auf Fehler
2. Stelle sicher, dass alle Dependencies installiert sind
3. Prüfe die Extension-Datei auf Syntaxfehler

### Performance-Probleme
1. Passe das Monitoring-Intervall an
2. Aktiviere nur benötigte Erweiterungen
3. Konfiguriere Log-Levels entsprechend

### Memory Leaks
1. Aktiviere detailliertes Memory-Monitoring
2. Prüfe WebSocket-Verbindungen
3. Überwache Session-Cleanup
`;
  }

  /**
   * Gibt Server-Test-Inhalt zurück
   * Returns server test content
   */
  getServerTestContent() {
    return `'use strict';

const request = require('supertest');
const { expect } = require('chai');
const { app, server } = require('../server-extended');

describe('Scratch Collaboration Server', () => {
  before((done) => {
    // Warte bis Server startet
    server.on('listening', () => {
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  describe('Health Check', () => {
    it('sollte Gesundheitsstatus zurückgeben', (done) => {
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('status');
          expect(res.body).to.have.property('timestamp');
          expect(res.body).to.have.property('uptime');
          done();
        });
    });
  });

  describe('API Sessions', () => {
    it('sollte Sessions-Liste zurückgeben', (done) => {
      request(app)
        .get('/api/sessions')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('sessions');
          expect(res.body).to.have.property('totalSessions');
          expect(res.body).to.have.property('timestamp');
          done();
        });
    });

    it('sollte 404 für nicht-existierende Session zurückgeben', (done) => {
      request(app)
        .get('/api/sessions/nonexistent')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  describe('WebSocket Connections', () => {
    it('sollte neue WebSocket-Verbindung akzeptieren', (done) => {
      const WebSocket = require('ws');
      const ws = new WebSocket('ws://localhost:' + server.address().port);

      ws.on('open', () => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (err) => {
        done(err);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('sollte Rate Limiting Headers setzen', (done) => {
      request(app)
        .get('/api/sessions')
        .expect((res) => {
          // Prüfe Rate Limit Headers falls aktiviert
          if (res.headers['x-ratelimit-limit']) {
            expect(res.headers['x-ratelimit-limit']).to.be.a('string');
          }
        })
        .expect(200, done);
    });
  });
});
`;
  }

  /**
   * Gibt API-Test-Inhalt zurück
   * Returns API test content
   */
  getApiTestContent() {
    return `'use strict';

const request = require('supertest');
const { expect } = require('chai');
const { app, server } = require('../server-extended');

describe('Extended API', () => {
  before((done) => {
    server.on('listening', () => {
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  describe('Project Stats', () => {
    it('sollte Projekt-Statistiken zurückgeben', (done) => {
      request(app)
        .get('/api/projects/123/stats')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('projectId');
          expect(res.body).to.have.property('participantCount');
          expect(res.body).to.have.property('participants');
          done();
        });
    });
  });

  describe('User Activity', () => {
    it('sollte Benutzer-Aktivität zurückgeben', (done) => {
      request(app)
        .get('/api/users/activity')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('users');
          expect(res.body).to.have.property('totalUsers');
          expect(res.body).to.have.property('timestamp');
          done();
        });
    });
  });

  describe('Server Metrics', () => {
    it('sollte Server-Metriken zurückgeben', (done) => {
      request(app)
        .get('/api/metrics')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('uptime');
          expect(res.body).to.have.property('memory');
          expect(res.body).to.have.property('sessions');
          expect(res.body).to.have.property('connections');
          done();
        });
    });
  });

  describe('Session Export', () => {
    it('sollte Session-Daten exportieren', (done) => {
      request(app)
        .get('/api/sessions/123/export')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property('projectId');
          expect(res.body).to.have.property('participants');
          expect(res.body).to.have.property('exportedAt');
          done();
        });
    });
  });
});
`;
  }

  /**
   * Gibt WebSocket-Test-Inhalt zurück
   * Returns WebSocket test content
   */
  getWebSocketTestContent() {
    return `'use strict';

const WebSocket = require('ws');
const { expect } = require('chai');
const { server } = require('../server-extended');

describe('WebSocket Integration', () => {
  let wsClient;
  const port = server.address().port;

  before((done) => {
    server.on('listening', () => {
      done();
    });
  });

  after((done) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
    server.close(done);
  });

  beforeEach((done) => {
    wsClient = new WebSocket(\`ws://localhost:\${port}\`);

    wsClient.on('open', () => {
      done();
    });

    wsClient.on('error', (err) => {
      done(err);
    });
  });

  afterEach(() => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
  });

  describe('Connection', () => {
    it('sollte erfolgreich verbinden', (done) => {
      const ws = new WebSocket(\`ws://localhost:\${port}\`);

      ws.on('open', () => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (err) => {
        done(err);
      });
    });

    it('sollte Welcome-Nachricht erhalten', (done) => {
      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).to.equal('welcome');
        expect(message).to.have.property('clientId');
        expect(message).to.have.property('timestamp');
        done();
      });
    });
  });

  describe('Project Collaboration', () => {
    it('sollte Projekt beitreten können', (done) => {
      const joinMessage = {
        type: 'join',
        projectId: 'test-project-123',
        userName: 'testuser'
      };

      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'welcome') {
          // Sende Join-Nachricht nach Welcome
          wsClient.send(JSON.stringify(joinMessage));
        } else if (message.type === 'joined') {
          expect(message.projectId).to.equal('test-project-123');
          expect(message).to.have.property('participantCount');
          done();
        }
      });
    });

    it('sollte Projekt-Updates broadcasten', (done) => {
      const joinMessage = {
        type: 'join',
        projectId: 'test-project-456',
        userName: 'testuser1'
      };

      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'welcome') {
          wsClient.send(JSON.stringify(joinMessage));
        } else if (message.type === 'joined') {
          // Sende Projekt-Update
          const updateMessage = {
            type: 'projectUpdate',
            projectId: 'test-project-456',
            updateData: {
              type: 'sprite_move',
              spriteId: 'sprite1',
              x: 100,
              y: 50
            }
          };

          wsClient.send(JSON.stringify(updateMessage));

          // Erwarte das gleiche Update zurück (broadcast)
          wsClient.on('message', (updateData) => {
            const update = JSON.parse(updateData.toString());
            if (update.type === 'projectUpdate') {
              expect(update.data.type).to.equal('sprite_move');
              done();
            }
          });
        }
      });
    });
  });

  describe('Authentication', () => {
    it('sollte Benutzer-Authentifizierung handhaben', (done) => {
      const authMessage = {
        type: 'authenticate',
        scratchAuth: {
          isLoggedIn: true,
          username: 'testuser',
          userId: 12345,
          avatar: 'https://example.com/avatar.png',
          profileUrl: 'https://scratch.mit.edu/users/testuser'
        }
      };

      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'welcome') {
          wsClient.send(JSON.stringify(authMessage));
        } else if (message.type === 'authenticated') {
          expect(message.success).to.equal(true);
          expect(message.username).to.equal('testuser');
          done();
        }
      });
    });
  });

  describe('Chat Messages', () => {
    it('sollte Chat-Nachrichten handhaben', (done) => {
      const joinMessage = {
        type: 'join',
        projectId: 'test-project-chat',
        userName: 'chatuser'
      };

      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'welcome') {
          wsClient.send(JSON.stringify(joinMessage));
        } else if (message.type === 'joined') {
          // Sende Chat-Nachricht
          const chatMessage = {
            type: 'chatMessage',
            projectId: 'test-project-chat',
            message: 'Hello, World!'
          };

          wsClient.send(JSON.stringify(chatMessage));

          // Erwarte die gleiche Nachricht zurück
          wsClient.on('message', (chatData) => {
            const chat = JSON.parse(chatData.toString());
            if (chat.type === 'chatMessage') {
              expect(chat.message).to.equal('Hello, World!');
              expect(chat.userName).to.equal('chatuser');
              done();
            }
          });
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('sollte ungültige Nachrichten handhaben', (done) => {
      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'welcome') {
          // Sende ungültige Nachricht
          wsClient.send('invalid json message');
        } else if (message.type === 'error') {
          expect(message).to.have.property('message');
          done();
        }
      });
    });

    it('sollte unbekannte Nachrichtentypen handhaben', (done) => {
      const unknownMessage = {
        type: 'unknownType',
        data: 'test'
      };

      wsClient.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'welcome') {
          wsClient.send(JSON.stringify(unknownMessage));
        } else if (message.type === 'error') {
          expect(message.message).to.include('Unknown message type');
          done();
        }
      });
    });
  });
});
`;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--extensions':
        options.extensions = args[++i] ? args[i].split(',') : [];
        break;
      case '--environments':
        options.environments = args[++i] ? args[i].split(',') : [];
        break;
      case '--docker':
        options.docker = true;
        break;
      case '--testing':
        options.testing = true;
        break;
      case '--help':
        console.log(`
Scratch Collaboration Server Extension Builder

Usage: node server-extension-builder.js [options]

Options:
  --extensions <list>     Comma-separated list of extensions to install
                         Available: monitoring, api, logging, auth, deployment
                         Default: monitoring,api,logging

  --environments <list>   Comma-separated list of environments to build
                         Available: development, production, test
                         Default: development,production

  --docker               Build Docker images for deployment

  --testing              Include testing framework and test files

  --help                 Show this help message

Examples:
  node server-extension-builder.js --extensions monitoring,api
  node server-extension-builder.js --environments production --docker
  node server-extension-builder.js --extensions monitoring,api,logging --docker --testing

\`);
        process.exit(0);
        break;
    }
  }

  const builder = new ServerExtensionBuilder();
  builder.build(options);
}

module.exports = ServerExtensionBuilder;
`;
  }

  <line_count>352</line_count>
</write_to_file>
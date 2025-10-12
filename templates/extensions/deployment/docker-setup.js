'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DockerSetup {
  constructor(config = {}) {
    this.config = {
      environments: config.environments || ['development', 'production'],
      registry: config.registry || null,
      tag: config.tag || 'latest',
      ...config
    };
  }

  /**
   * Erstellt Dockerfile für eine Umgebung
   * Creates Dockerfile for an environment
   */
  createDockerfile(buildDir, environment) {
    console.log(`  📝 Creating Dockerfile for ${environment}...`);

    const dockerfileContent = `FROM node:18-alpine

# Setze Arbeitsverzeichnis
WORKDIR /app

# Installiere System-Dependencies für native modules
RUN apk add --no-cache python3 make g++

# Kopiere Package-Dateien
COPY package*.json ./

# Installiere Dependencies
RUN npm ci --only=production

# Kopiere Anwendungs-Dateien
COPY server-extended.js .
COPY config.json .
COPY extensions/ ./extensions/

# Erstelle Log-Verzeichnis
RUN mkdir -p logs

# Erstelle nicht-root Benutzer
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Wechsle zu nicht-root Benutzer
USER nextjs

# Exponiere Port
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "const http=require('http');const req=http.request({hostname:'localhost',port:3000,path:'/health'},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Setze Umgebungsvariable
ENV NODE_ENV=${environment}

# Starte Anwendung
CMD ["node", "server-extended.js"]
`;

    const dockerfilePath = path.join(buildDir, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('    ✓ Dockerfile created');
  }

  /**
   * Erstellt docker-compose.yml
   * Creates docker-compose.yml
   */
  createDockerCompose(buildDir, environment) {
    console.log(`  📝 Creating docker-compose.yml for ${environment}...`);

    const composeContent = `version: '3.8'
services:
  scratch-collab:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${environment}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "const http=require('http');const req=http.request({hostname:'localhost',port:3000,path:'/health'},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Load Balancer für mehrere Instanzen
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #   volumes:
  #     - ./nginx.conf:/etc/nginx/nginx.conf
  #   depends_on:
  #     - scratch-collab
`;

    const composePath = path.join(buildDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, composeContent);
    console.log('    ✓ docker-compose.yml created');
  }

  /**
   * Erstellt .dockerignore
   * Creates .dockerignore
   */
  createDockerignore(buildDir) {
    console.log('  📝 Creating .dockerignore...');

    const dockerignoreContent = `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.vscode
.idea
*.log
logs/
dist/
build/
tmp/
temp/
.DS_Store
Thumbs.db
`;

    const dockerignorePath = path.join(buildDir, '.dockerignore');
    fs.writeFileSync(dockerignorePath, dockerignoreContent);
    console.log('    ✓ .dockerignore created');
  }

  /**
   * Baut Docker-Image
   * Builds Docker image
   */
  buildImage(buildDir, environment, options = {}) {
    console.log(`  🐳 Building Docker image for ${environment}...`);

    const imageName = options.imageName || `scratch-collab-${environment}`;
    const tag = options.tag || this.config.tag;

    try {
      const buildCmd = `docker build -t ${imageName}:${tag} .`;

      execSync(buildCmd, {
        cwd: buildDir,
        stdio: 'inherit'
      });

      console.log(`  ✅ Docker image built: ${imageName}:${tag}`);

      // Push zu Registry falls konfiguriert
      if (this.config.registry) {
        this.pushImage(imageName, tag);
      }

      return { success: true, imageName, tag };

    } catch (error) {
      console.error('  ❌ Docker build failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Pusht Image zu Registry
   * Pushes image to registry
   */
  pushImage(imageName, tag) {
    console.log(`  📤 Pushing image to registry...`);

    try {
      const fullImageName = `${this.config.registry}/${imageName}:${tag}`;

      execSync(`docker tag ${imageName}:${tag} ${fullImageName}`, { stdio: 'inherit' });
      execSync(`docker push ${fullImageName}`, { stdio: 'inherit' });

      console.log(`  ✅ Image pushed: ${fullImageName}`);

    } catch (error) {
      console.error('  ❌ Failed to push image');
      throw new Error(`Image push failed: ${error.message}`);
    }
  }

  /**
   * Startet Container
   * Starts container
   */
  startContainer(environment, options = {}) {
    console.log(`  🚀 Starting container for ${environment}...`);

    const containerName = options.containerName || `scratch-collab-${environment}`;
    const imageName = options.imageName || `scratch-collab-${environment}`;
    const tag = options.tag || this.config.tag;

    try {
      // Stoppe und entferne existierenden Container
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
        ${options.volume ? `-v ${options.volume}:/app/logs` : ''} \\
        ${imageName}:${tag}`;

      execSync(dockerCmd, { stdio: 'inherit' });
      console.log(`  ✅ Container started: ${containerName}`);

      return { success: true, containerName };

    } catch (error) {
      console.error('  ❌ Failed to start container');
      return { success: false, error: error.message };
    }
  }

  /**
   * Stoppt und entfernt Container
   * Stops and removes container
   */
  stopContainer(containerName) {
    console.log(`  🛑 Stopping container ${containerName}...`);

    try {
      execSync(`docker stop ${containerName}`, { stdio: 'inherit' });
      execSync(`docker rm ${containerName}`, { stdio: 'inherit' });
      console.log(`  ✅ Container stopped: ${containerName}`);
      return { success: true };
    } catch (error) {
      console.error('  ❌ Failed to stop container');
      return { success: false, error: error.message };
    }
  }

  /**
   * Zeigt Container-Logs an
   * Shows container logs
   */
  showLogs(containerName, options = {}) {
    console.log(`📋 Showing logs for ${containerName}...`);

    try {
      const logOptions = [];
      if (options.lines) logOptions.push(`--tail ${options.lines}`);
      if (options.follow) logOptions.push('-f');

      execSync(`docker logs ${logOptions.join(' ')} ${containerName}`, {
        stdio: 'inherit'
      });

      return { success: true };
    } catch (error) {
      console.error('  ❌ Failed to show logs');
      return { success: false, error: error.message };
    }
  }

  /**
   * Führt Health Check für Container aus
   * Performs health check for container
   */
  healthCheck(containerName) {
    console.log(`🏥 Health check for ${containerName}...`);

    try {
      const result = execSync(`docker inspect ${containerName} --format='{{.State.Health.Status}}'`, {
        stdio: 'pipe'
      });

      const health = result.toString().trim();
      console.log(`  📊 Container health: ${health}`);

      return { success: true, health };
    } catch (error) {
      console.error('  ❌ Health check failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Zeigt alle Scratch Collab Container an
   * Lists all Scratch Collab containers
   */
  listContainers() {
    console.log('📋 Listing Scratch Collab containers...');

    try {
      const result = execSync(`docker ps -a --filter name=scratch-collab --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"`, {
        stdio: 'pipe'
      });

      console.log(result.toString());
      return { success: true };
    } catch (error) {
      console.error('  ❌ Failed to list containers');
      return { success: false, error: error.message };
    }
  }

  /**
   * Räumt ungenutzte Images auf
   * Cleans up unused images
   */
  cleanup() {
    console.log('🧹 Cleaning up Docker resources...');

    try {
      // Entferne gestoppte Container
      execSync('docker container prune -f', { stdio: 'pipe' });

      // Entferne ungenutzte Images
      execSync('docker image prune -f', { stdio: 'pipe' });

      // Entferne ungenutzte Netzwerke
      execSync('docker network prune -f', { stdio: 'pipe' });

      console.log('  ✅ Cleanup completed');
      return { success: true };
    } catch (error) {
      console.error('  ❌ Cleanup failed');
      return { success: false, error: error.message };
    }
  }
}

module.exports = DockerSetup;
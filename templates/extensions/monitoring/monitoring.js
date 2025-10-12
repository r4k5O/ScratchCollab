'use strict';

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

    // Update WebSocket connections if available
    if (this.server.wss) {
      this.metrics.websocketConnections = this.server.wss.clients.size;
    }

    // Update active sessions if available
    if (this.server.collaborationSessions) {
      this.metrics.activeSessions = this.server.collaborationSessions.size;
    }

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
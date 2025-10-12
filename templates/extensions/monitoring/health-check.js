'use strict';

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
        message: `Heap usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
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
        message: `Active connections: ${connectionCount}`,
        details: { connectionCount }
      };
    });

    // Active sessions check
    this.registerCheck('sessions', () => {
      const sessionCount = this.server.collaborationSessions ?
        this.server.collaborationSessions.size : 0;

      return {
        status: 'healthy',
        message: `Active sessions: ${sessionCount}`,
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
          message: `Check failed: ${error.message}`,
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
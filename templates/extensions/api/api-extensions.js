'use strict';

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
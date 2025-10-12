'use strict';

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
      fs.appendFileSync(this.config.file, message + '\n');
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

    console.log(`[AUDIT] ${action}`, details);
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
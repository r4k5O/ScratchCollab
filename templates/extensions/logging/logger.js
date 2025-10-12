'use strict';

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

      fs.appendFileSync(this.config.file, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  rotateLogFile() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = this.config.file.replace('.log', `-${timestamp}.log`);

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
      const consoleMessage = `[${level.toUpperCase()}] ${message}`;
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
          duration: `${duration}ms`
        });
      });

      next();
    };
  }
}

module.exports = Logger;
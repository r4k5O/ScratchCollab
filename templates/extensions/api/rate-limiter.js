'use strict';

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
          message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
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
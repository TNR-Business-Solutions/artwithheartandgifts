class Logger {
  constructor() {
    this.startTime = Date.now();
  }

  formatMessage(level, category, status, message) {
    const timestamp = new Date().toISOString();
    const runtime = Date.now() - this.startTime;
    return `[${timestamp}] [${level}] [${category}] [${status}] ${message}`;
  }

  order(orderId, status, message) {
    const logMessage = this.formatMessage(
      "ORDER",
      orderId || "UNKNOWN",
      status,
      message
    );
    console.log(logMessage);

    // In production, you might want to send this to a logging service
    // For now, we'll just use console.log
  }

  email(provider, status, message) {
    const logMessage = this.formatMessage(
      "EMAIL",
      provider || "UNKNOWN",
      status,
      message
    );
    console.log(logMessage);
  }

  api(endpoint, method, status, message) {
    const logMessage = this.formatMessage(
      "API",
      `${method} ${endpoint}`,
      status,
      message
    );
    console.log(logMessage);
  }

  error(component, error) {
    const logMessage = this.formatMessage(
      "ERROR",
      component || "UNKNOWN",
      "FAILED",
      error.message || error
    );
    console.error(logMessage);
    console.error("Stack trace:", error.stack);
  }

  info(component, message) {
    const logMessage = this.formatMessage(
      "INFO",
      component || "SYSTEM",
      "INFO",
      message
    );
    console.log(logMessage);
  }

  debug(component, message) {
    if (process.env.NODE_ENV === "development") {
      const logMessage = this.formatMessage(
        "DEBUG",
        component || "SYSTEM",
        "DEBUG",
        message
      );
      console.log(logMessage);
    }
  }

  // Performance logging
  performance(operation, startTime, endTime) {
    const duration = endTime - startTime;
    const logMessage = this.formatMessage(
      "PERF",
      operation,
      "COMPLETED",
      `Duration: ${duration}ms`
    );
    console.log(logMessage);
  }

  // Request/Response logging
  request(req, res) {
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const userAgent = req.headers["user-agent"] || "Unknown";

    const logMessage = this.formatMessage(
      "REQUEST",
      `${method} ${url}`,
      status,
      `User-Agent: ${userAgent}`
    );
    console.log(logMessage);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;

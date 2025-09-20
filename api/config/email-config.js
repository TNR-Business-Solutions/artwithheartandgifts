require("dotenv").config();

class EmailConfig {
  constructor() {
    this.config = {
      providers: {
        gmail: {
          enabled: process.env.EMAIL_GMAIL_ENABLED !== 'false',
          timeout: parseInt(process.env.EMAIL_GMAIL_TIMEOUT) || 5000,
          priority: 1,
          name: 'gmail'
        },
        formsubmit: {
          enabled: process.env.EMAIL_FORMSUBMIT_ENABLED !== 'false',
          timeout: parseInt(process.env.EMAIL_FORMSUBMIT_TIMEOUT) || 10000,
          priority: 2,
          name: 'formsubmit'
        }
      },
      retry: {
        attempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 2,
        delay: parseInt(process.env.EMAIL_RETRY_DELAY) || 1000
      },
      fallback: {
        enabled: process.env.EMAIL_FALLBACK_ENABLED !== 'false',
        primaryProvider: process.env.EMAIL_PRIMARY_PROVIDER || 'gmail',
        fallbackProvider: process.env.EMAIL_FALLBACK_PROVIDER || 'formsubmit'
      },
      monitoring: {
        enabled: process.env.EMAIL_MONITORING_ENABLED !== 'false',
        healthCheckInterval: parseInt(process.env.EMAIL_HEALTH_CHECK_INTERVAL) || 300000, // 5 minutes
        maxFailuresBeforeDisable: parseInt(process.env.EMAIL_MAX_FAILURES) || 5
      }
    };

    this.validateConfig();
  }

  validateConfig() {
    // Ensure we have at least one email provider enabled
    const enabledProviders = Object.values(this.config.providers).filter(p => p.enabled);
    if (enabledProviders.length === 0) {
      throw new Error('At least one email provider must be enabled');
    }

    // Validate environment variables
    if (this.config.providers.gmail.enabled) {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Gmail provider enabled but EMAIL_USER or EMAIL_PASS not set');
      }
    }

    if (!process.env.RECIPIENT_EMAIL) {
      console.warn('RECIPIENT_EMAIL not set - emails will not be delivered');
    }
  }

  getProviderConfig(providerName) {
    return this.config.providers[providerName];
  }

  getEnabledProviders() {
    return Object.values(this.config.providers)
      .filter(provider => provider.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  isProviderEnabled(providerName) {
    const provider = this.config.providers[providerName];
    return provider ? provider.enabled : false;
  }

  getRetryConfig() {
    return this.config.retry;
  }

  getFallbackConfig() {
    return this.config.fallback;
  }

  getMonitoringConfig() {
    return this.config.monitoring;
  }

  // Update provider status (for health monitoring)
  updateProviderStatus(providerName, isHealthy) {
    if (this.config.providers[providerName]) {
      this.config.providers[providerName].lastHealthCheck = new Date().toISOString();
      this.config.providers[providerName].isHealthy = isHealthy;
    }
  }

  // Get provider health status
  getProviderHealth(providerName) {
    const provider = this.config.providers[providerName];
    if (!provider) return null;

    return {
      name: provider.name,
      enabled: provider.enabled,
      isHealthy: provider.isHealthy,
      lastHealthCheck: provider.lastHealthCheck,
      priority: provider.priority
    };
  }

  // Get all providers health status
  getAllProvidersHealth() {
    const health = {};
    Object.keys(this.config.providers).forEach(providerName => {
      health[providerName] = this.getProviderHealth(providerName);
    });
    return health;
  }

  // Temporarily disable a provider (for health monitoring)
  temporarilyDisableProvider(providerName, reason = 'Health check failed') {
    if (this.config.providers[providerName]) {
      this.config.providers[providerName].enabled = false;
      this.config.providers[providerName].disabledReason = reason;
      this.config.providers[providerName].disabledAt = new Date().toISOString();
      console.warn(`Provider ${providerName} temporarily disabled: ${reason}`);
    }
  }

  // Re-enable a provider
  reEnableProvider(providerName) {
    if (this.config.providers[providerName]) {
      this.config.providers[providerName].enabled = true;
      delete this.config.providers[providerName].disabledReason;
      delete this.config.providers[providerName].disabledAt;
      console.log(`Provider ${providerName} re-enabled`);
    }
  }

  // Get full configuration (for debugging)
  getFullConfig() {
    return {
      ...this.config,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
        RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL ? 'SET' : 'NOT SET'
      }
    };
  }
}

// Create singleton instance
const emailConfig = new EmailConfig();

module.exports = emailConfig;

require("dotenv").config();
const EmailManager = require("./utils/email-manager");
const emailConfig = require("./config/email-config");
const ErrorHandler = require("./utils/error-handler");
const logger = require("./utils/logger");

const errorHandler = new ErrorHandler();

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return errorHandler.handleCorsPreflight(res);
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return errorHandler.handleMethodNotAllowed(res);
  }

  try {
    logger.api("/api/health", "GET", "STARTED", "Health check initiated");

    const startTime = Date.now();
    const emailManager = new EmailManager();

    // Test each email provider
    const providerTests = {};
    const enabledProviders = emailConfig.getEnabledProviders();

    for (const provider of enabledProviders) {
      try {
        const testResult = await emailManager.testProvider(provider.name);
        providerTests[provider.name] = {
          ...testResult,
          config: emailConfig.getProviderHealth(provider.name),
          responseTime: Date.now() - startTime,
        };

        // Update provider health status
        emailConfig.updateProviderStatus(provider.name, testResult.success);
      } catch (error) {
        providerTests[provider.name] = {
          success: false,
          provider: provider.name,
          error: error.message,
          config: emailConfig.getProviderHealth(provider.name),
          responseTime: Date.now() - startTime,
        };

        emailConfig.updateProviderStatus(provider.name, false);
      }
    }

    // Overall system health
    const overallHealth = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      providers: {
        total: Object.keys(emailConfig.config.providers).length,
        enabled: enabledProviders.length,
        healthy: Object.values(providerTests).filter((p) => p.success).length,
      },
      configuration: {
        fallbackEnabled: emailConfig.getFallbackConfig().enabled,
        primaryProvider: emailConfig.getFallbackConfig().primaryProvider,
        fallbackProvider: emailConfig.getFallbackConfig().fallbackProvider,
        retryAttempts: emailConfig.getRetryConfig().attempts,
      },
    };

    // Determine overall status
    const healthyProviders = Object.values(providerTests).filter(
      (p) => p.success
    ).length;
    if (healthyProviders === 0) {
      overallHealth.status = "critical";
    } else if (healthyProviders < enabledProviders.length) {
      overallHealth.status = "degraded";
    }

    const response = errorHandler.createSuccessResponse(
      {
        overall: overallHealth,
        providers: providerTests,
        config: emailConfig.getFullConfig(),
      },
      {
        responseTime: Date.now() - startTime,
        requestId: errorHandler.generateRequestId(),
      }
    );

    logger.api(
      "/api/health",
      "GET",
      "COMPLETED",
      `Health check completed in ${Date.now() - startTime}ms`
    );

    // Return appropriate status code based on health
    const statusCode = overallHealth.status === "critical" ? 503 : 200;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error("health-check", error);

    const errorResponse = errorHandler.handleSystemError(error);
    res.status(500).json(errorResponse);
  }
};

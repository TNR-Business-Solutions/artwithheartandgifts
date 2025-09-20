require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const EmailManager = require("./utils/email-manager");
const ErrorHandler = require("./utils/error-handler");
const logger = require("./utils/logger");
const emailConfig = require("./config/email-config");

const errorHandler = new ErrorHandler();

module.exports = async function handler(req, res) {
  // Ensure this is properly recognized as a Vercel function
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return errorHandler.handleCorsPreflight(res);
  }

  try {
    const startTime = Date.now();
    const { method } = req;
    const url = req.url || req.path || "";

    console.log(`[VERCEL] ${method} ${url}`);

    // Route based on URL path and method
    if (method === "GET" && (url.includes("health") || url === "/")) {
      return await handleHealth(req, res, startTime);
    }

    if (method === "POST" && url.includes("enhanced-checkout")) {
      return await handleEnhancedCheckout(req, res, startTime);
    }

    if (method === "POST" && url.includes("secure-checkout")) {
      return await handleSecureCheckout(req, res, startTime);
    }

    if (method === "POST" && url.includes("contact")) {
      return await handleContact(req, res, startTime);
    }

    if (method === "POST" && url.includes("commission")) {
      return await handleCommission(req, res, startTime);
    }

    if (method === "POST" && url.includes("test-gmail")) {
      return await handleTestGmail(req, res, startTime);
    }

    // Default response for unknown endpoints
    return res.status(200).json({
      success: true,
      message: "Art with Heart & Gifts API",
      availableEndpoints: [
        "GET /api/health",
        "POST /api/enhanced-checkout",
        "POST /api/secure-checkout",
        "POST /api/contact",
        "POST /api/commission",
        "POST /api/test-gmail",
      ],
      method: method,
      url: url,
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Internal server error", details: error.message },
    });
  }
};

// Health Check Handler
async function handleHealth(req, res, startTime) {
  logger.api("/api/health", "GET", "STARTED", "Health check initiated");

  const emailManager = new EmailManager();
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

  const statusCode = overallHealth.status === "critical" ? 503 : 200;
  res.status(statusCode).json(response);
}

// Enhanced Checkout Handler
async function handleEnhancedCheckout(req, res, startTime) {
  logger.api(
    "/api/enhanced-checkout",
    "POST",
    "STARTED",
    "Enhanced checkout request received"
  );

  // Parse request body
  let body;
  if (req.body) {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } else {
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });
    body = JSON.parse(rawBody);
  }

  // Validate request
  const validation = errorHandler.validateCheckoutRequest(body);
  if (!validation.valid) {
    logger.api(
      "/api/enhanced-checkout",
      "POST",
      "VALIDATION_FAILED",
      "Invalid request data"
    );
    return res.status(validation.error.error.code).json(validation.error);
  }

  const {
    customerInfo,
    cartItems,
    paymentInfo,
    totalAmount,
    orderId,
    referenceNumber,
  } = body;

  // Generate order details
  const orderNumber = `AWH-${uuidv4().substring(0, 8).toUpperCase()}`;
  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  logger.order(
    orderNumber,
    "CREATED",
    `Order created for ${customerInfo.firstName} ${customerInfo.lastName || ""}`
  );

  // Prepare order data for email manager
  const orderData = {
    customerInfo,
    cartItems,
    paymentInfo,
    totalAmount,
    orderNumber,
    orderDate,
    referenceNumber,
    orderId: orderId || orderNumber,
  };

  // Send emails using EmailManager
  const emailManager = new EmailManager();
  let emailResult;

  try {
    emailResult = await emailManager.sendOrderEmails(orderData);
    logger.order(
      orderNumber,
      "EMAILS_SENT",
      `Emails sent via ${emailResult.provider}`
    );
  } catch (emailError) {
    logger.error("enhanced-checkout", emailError);
    logger.order(orderNumber, "EMAIL_FAILED", emailError.message);
    emailResult = {
      success: false,
      provider: "none",
      error: emailError.message,
    };
  }

  // Prepare success response
  const responseData = {
    orderId: orderId || orderNumber,
    orderNumber,
    orderDate,
    customerInfo: {
      name: `${customerInfo.firstName} ${customerInfo.lastName || ""}`,
      email: customerInfo.email,
    },
    totalAmount,
    paymentStatus: "pending",
    transactionId: paymentInfo.transactionId,
    emailDelivery: {
      success: emailResult.success,
      provider: emailResult.provider,
      messageId: emailResult.messageId,
      details: emailResult.details || emailResult.error,
    },
  };

  const response = errorHandler.createSuccessResponse(responseData, {
    processingTime: Date.now() - startTime,
    orderNumber,
    emailProvider: emailResult.provider,
  });

  logger.api(
    "/api/enhanced-checkout",
    "POST",
    "COMPLETED",
    `Order ${orderNumber} processed successfully in ${Date.now() - startTime}ms`
  );
  logger.order(orderNumber, "COMPLETED", "Order processing completed");

  res.status(200).json(response);
}

// Secure Checkout Handler (Legacy)
async function handleSecureCheckout(req, res, startTime) {
  const nodemailer = require("nodemailer");

  // Parse request body
  let body;
  if (req.body) {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } else {
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });
    body = JSON.parse(rawBody);
  }

  const {
    customerInfo,
    cartItems,
    paymentInfo,
    totalAmount,
    orderId,
    referenceNumber,
  } = body;

  // Validate required fields
  if (!customerInfo || !cartItems || !totalAmount || !paymentInfo) {
    return res.status(400).json({
      error: "Missing required checkout information",
      details: {
        customerInfo: !!customerInfo,
        cartItems: !!cartItems,
        totalAmount: !!totalAmount,
        paymentInfo: !!paymentInfo,
      },
    });
  }

  const orderNumber = `AWH-${uuidv4().substring(0, 8).toUpperCase()}`;
  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Try to send emails (simplified version)
  try {
    const businessEmailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Order #${orderNumber} - $${totalAmount.toFixed(2)}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer:</strong> ${customerInfo.firstName} ${
        customerInfo.lastName
      }</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
        <p><strong>Items:</strong> ${cartItems.length} item(s)</p>
      `,
    };

    await transporter.sendMail(businessEmailOptions);
  } catch (error) {
    console.log("Email failed, but order processed:", error.message);
  }

  return res.status(200).json({
    success: true,
    orderId: orderId || orderNumber,
    message: "Order processed successfully!",
    paymentStatus: "pending",
    transactionId: paymentInfo.transactionId,
  });
}

// Contact Handler
async function handleContact(req, res, startTime) {
  logger.api("/api/contact", "POST", "STARTED", "Contact request received");

  // Parse request body
  let body;
  if (req.body) {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } else {
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });
    body = JSON.parse(rawBody);
  }

  const { customerInfo, message, subject } = body;

  // Validate request
  if (!customerInfo || !message) {
    return res.status(400).json({
      success: false,
      error: { message: "Missing required fields", code: 400 },
    });
  }

  // Send email using EmailManager
  const emailManager = new EmailManager();
  let emailResult;

  try {
    const gmailProvider = emailManager.providers.find(
      (p) => p.name === "gmail"
    );
    const formsubmitProvider = emailManager.providers.find(
      (p) => p.name === "formsubmit"
    );

    if (gmailProvider && gmailProvider.enabled) {
      try {
        emailResult = await gmailProvider.handler.sendContactEmail({
          customerInfo,
          message,
          subject,
        });
        emailResult.provider = "gmail";
      } catch (gmailError) {
        if (formsubmitProvider && formsubmitProvider.enabled) {
          emailResult = await formsubmitProvider.handler.sendContactEmail({
            customerInfo,
            message,
            subject,
          });
          emailResult.provider = "formsubmit";
        } else {
          throw gmailError;
        }
      }
    } else if (formsubmitProvider && formsubmitProvider.enabled) {
      emailResult = await formsubmitProvider.handler.sendContactEmail({
        customerInfo,
        message,
        subject,
      });
      emailResult.provider = "formsubmit";
    } else {
      throw new Error("No email providers available");
    }

    const response = errorHandler.createSuccessResponse(
      {
        messageId: emailResult.messageId,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
        },
        emailDelivery: {
          success: emailResult.success,
          provider: emailResult.provider,
          messageId: emailResult.messageId,
          details: emailResult.details,
        },
      },
      {
        processingTime: Date.now() - startTime,
        emailProvider: emailResult.provider,
      }
    );

    logger.api(
      "/api/contact",
      "POST",
      "COMPLETED",
      `Contact form processed successfully`
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error("contact", error);
    const errorResponse = errorHandler.handleSystemError(error);
    res.status(500).json(errorResponse);
  }
}

// Commission Handler
async function handleCommission(req, res, startTime) {
  logger.api(
    "/api/commission",
    "POST",
    "STARTED",
    "Commission request received"
  );

  // Parse request body
  let body;
  if (req.body) {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } else {
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });
    body = JSON.parse(rawBody);
  }

  const { customerInfo, projectDetails } = body;

  // Validate request
  if (!customerInfo || !projectDetails) {
    return res.status(400).json({
      success: false,
      error: { message: "Missing required fields", code: 400 },
    });
  }

  // Send email using EmailManager
  const emailManager = new EmailManager();
  let emailResult;

  try {
    const gmailProvider = emailManager.providers.find(
      (p) => p.name === "gmail"
    );
    const formsubmitProvider = emailManager.providers.find(
      (p) => p.name === "formsubmit"
    );

    if (gmailProvider && gmailProvider.enabled) {
      try {
        emailResult = await gmailProvider.handler.sendCommissionEmail({
          customerInfo,
          projectDetails,
        });
        emailResult.provider = "gmail";
      } catch (gmailError) {
        if (formsubmitProvider && formsubmitProvider.enabled) {
          emailResult = await formsubmitProvider.handler.sendCommissionEmail({
            customerInfo,
            projectDetails,
          });
          emailResult.provider = "formsubmit";
        } else {
          throw gmailError;
        }
      }
    } else if (formsubmitProvider && formsubmitProvider.enabled) {
      emailResult = await formsubmitProvider.handler.sendCommissionEmail({
        customerInfo,
        projectDetails,
      });
      emailResult.provider = "formsubmit";
    } else {
      throw new Error("No email providers available");
    }

    const response = errorHandler.createSuccessResponse(
      {
        messageId: emailResult.messageId,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
        },
        projectDetails: {
          type: projectDetails.type,
          size: projectDetails.size,
          budget: projectDetails.budget,
        },
        emailDelivery: {
          success: emailResult.success,
          provider: emailResult.provider,
          messageId: emailResult.messageId,
          details: emailResult.details,
        },
      },
      {
        processingTime: Date.now() - startTime,
        emailProvider: emailResult.provider,
      }
    );

    logger.api(
      "/api/commission",
      "POST",
      "COMPLETED",
      `Commission form processed successfully`
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error("commission", error);
    const errorResponse = errorHandler.handleSystemError(error);
    res.status(500).json(errorResponse);
  }
}

// Test Gmail Handler
async function handleTestGmail(req, res, startTime) {
  const nodemailer = require("nodemailer");

  try {
    console.log("Testing Gmail SMTP connection...");

    const transporter = nodemailer.createTransporter({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Gmail SMTP Test - " + new Date().toLocaleString(),
      html: `
        <h2>Gmail SMTP Test Successful!</h2>
        <p>This is a test email to verify Gmail SMTP configuration is working.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);

    return res.status(200).json({
      success: true,
      message: "Gmail SMTP test successful!",
      messageId: result.messageId,
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
    });
  } catch (error) {
    console.error("Gmail SMTP test failed:", error);
    return res.status(500).json({
      error: "Gmail SMTP test failed",
      details: error.message,
      code: error.code,
    });
  }
}

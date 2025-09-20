require("dotenv").config();
const EmailManager = require("./utils/email-manager");
const ErrorHandler = require("./utils/error-handler");
const logger = require("./utils/logger");

const errorHandler = new ErrorHandler();

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return errorHandler.handleCorsPreflight(res);
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return errorHandler.handleMethodNotAllowed(res);
  }

  try {
    const startTime = Date.now();
    logger.api(
      "/api/enhanced-commission",
      "POST",
      "STARTED",
      "Enhanced commission request received"
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

    logger.debug(
      "enhanced-commission",
      `Request body: ${JSON.stringify(body, null, 2)}`
    );

    // Validate request
    const validation = errorHandler.validateCommissionRequest(body);
    if (!validation.valid) {
      logger.api(
        "/api/enhanced-commission",
        "POST",
        "VALIDATION_FAILED",
        "Invalid request data"
      );
      return res.status(validation.error.error.code).json(validation.error);
    }

    const { customerInfo, projectDetails } = body;

    // Send email using EmailManager
    const emailManager = new EmailManager();
    let emailResult;

    try {
      // Get the first available provider (Gmail or FormSubmit)
      const providers = emailManager.getProviderStatus();
      const gmailProvider = emailManager.providers.find(
        (p) => p.name === "gmail"
      );
      const formsubmitProvider = emailManager.providers.find(
        (p) => p.name === "formsubmit"
      );

      // Try Gmail first, then FormSubmit
      if (gmailProvider && gmailProvider.enabled) {
        try {
          emailResult = await gmailProvider.handler.sendCommissionEmail({
            customerInfo,
            projectDetails,
          });
          emailResult.provider = "gmail";
        } catch (gmailError) {
          logger.email(
            "gmail",
            false,
            `Commission email failed: ${gmailError.message}`
          );
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

      logger.api(
        "/api/enhanced-commission",
        "POST",
        "EMAIL_SENT",
        `Commission email sent via ${emailResult.provider}`
      );
    } catch (emailError) {
      logger.error("enhanced-commission", emailError);
      logger.api(
        "/api/enhanced-commission",
        "POST",
        "EMAIL_FAILED",
        emailError.message
      );

      const errorResponse = errorHandler.handleEmailError("all", emailError);
      return res.status(500).json(errorResponse);
    }

    // Prepare success response
    const responseData = {
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
    };

    const response = errorHandler.createSuccessResponse(responseData, {
      processingTime: Date.now() - startTime,
      emailProvider: emailResult.provider,
    });

    logger.api(
      "/api/enhanced-commission",
      "POST",
      "COMPLETED",
      `Commission form processed successfully in ${Date.now() - startTime}ms`
    );

    res.status(200).json(response);
  } catch (error) {
    logger.error("enhanced-commission", error);
    logger.api("/api/enhanced-commission", "POST", "FAILED", error.message);

    const errorResponse = errorHandler.handleSystemError(error);
    res.status(500).json(errorResponse);
  }
};

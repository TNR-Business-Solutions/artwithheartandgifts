require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
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

    logger.debug(
      "enhanced-checkout",
      `Request body: ${JSON.stringify(body, null, 2)}`
    );

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
      `Order created for ${customerInfo.firstName} ${
        customerInfo.lastName || ""
      }`
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
      `Order ${orderNumber} processed successfully in ${
        Date.now() - startTime
      }ms`
    );
    logger.order(orderNumber, "COMPLETED", "Order processing completed");

    res.status(200).json(response);
  } catch (error) {
    logger.error("enhanced-checkout", error);
    logger.api("/api/enhanced-checkout", "POST", "FAILED", error.message);

    const errorResponse = errorHandler.handleSystemError(error);
    res.status(500).json(errorResponse);
  }
};

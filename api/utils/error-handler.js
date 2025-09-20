const logger = require("./logger");

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION_ERROR: {
        code: 400,
        type: "validation",
        message: "Invalid request data",
      },
      EMAIL_FAILURE: {
        code: 500,
        type: "email",
        message: "Email delivery failed",
      },
      PAYMENT_ERROR: {
        code: 402,
        type: "payment",
        message: "Payment processing error",
      },
      SYSTEM_ERROR: {
        code: 500,
        type: "system",
        message: "Internal server error",
      },
      PROVIDER_ERROR: {
        code: 500,
        type: "provider",
        message: "Email provider error",
      },
      TIMEOUT_ERROR: { code: 504, type: "timeout", message: "Request timeout" },
      UNAUTHORIZED: { code: 401, type: "auth", message: "Unauthorized access" },
      NOT_FOUND: {
        code: 404,
        type: "not_found",
        message: "Resource not found",
      },
      METHOD_NOT_ALLOWED: {
        code: 405,
        type: "method",
        message: "Method not allowed",
      },
    };
  }

  createErrorResponse(errorType, details = null, originalError = null) {
    const errorConfig = this.errorTypes[errorType];

    if (!errorConfig) {
      errorConfig = this.errorTypes.SYSTEM_ERROR;
    }

    const response = {
      success: false,
      error: {
        type: errorConfig.type,
        message: errorConfig.message,
        code: errorConfig.code,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      },
    };

    // Add details if provided
    if (details) {
      response.error.details = details;
    }

    // Add original error in development mode
    if (originalError && process.env.NODE_ENV === "development") {
      response.error.originalError = {
        message: originalError.message,
        stack: originalError.stack,
      };
    }

    // Log the error
    logger.error(errorConfig.type, originalError || details);

    return response;
  }

  createSuccessResponse(data = null, meta = {}) {
    const response = {
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        ...meta,
      },
    };

    if (data) {
      response.data = data;
    }

    return response;
  }

  handleValidationError(missingFields) {
    return this.createErrorResponse(
      "VALIDATION_ERROR",
      `Missing required fields: ${missingFields.join(", ")}`
    );
  }

  handleEmailError(provider, error) {
    return this.createErrorResponse(
      "EMAIL_FAILURE",
      `Email delivery failed via ${provider}: ${error.message}`,
      error
    );
  }

  handleProviderError(provider, error) {
    return this.createErrorResponse(
      "PROVIDER_ERROR",
      `${provider} provider error: ${error.message}`,
      error
    );
  }

  handleSystemError(error) {
    return this.createErrorResponse(
      "SYSTEM_ERROR",
      "An unexpected error occurred",
      error
    );
  }

  // Validate request body structure
  validateCheckoutRequest(body) {
    const requiredFields = [
      "customerInfo",
      "cartItems",
      "totalAmount",
      "paymentInfo",
    ];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return { valid: false, error: this.handleValidationError(missingFields) };
    }

    // Validate customer info structure
    const customerRequired = ["email", "firstName"];
    const customerMissing = [];

    customerRequired.forEach((field) => {
      if (!body.customerInfo[field]) {
        customerMissing.push(`customerInfo.${field}`);
      }
    });

    if (customerMissing.length > 0) {
      return {
        valid: false,
        error: this.handleValidationError(customerMissing),
      };
    }

    // Validate payment info structure
    const paymentRequired = [
      "cardholderName",
      "cardNumber",
      "expirationDate",
      "cvv",
    ];
    const paymentMissing = [];

    paymentRequired.forEach((field) => {
      if (!body.paymentInfo[field]) {
        paymentMissing.push(`paymentInfo.${field}`);
      }
    });

    if (paymentMissing.length > 0) {
      return {
        valid: false,
        error: this.handleValidationError(paymentMissing),
      };
    }

    return { valid: true };
  }

  validateContactRequest(body) {
    const requiredFields = ["customerInfo", "message"];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return { valid: false, error: this.handleValidationError(missingFields) };
    }

    // Validate customer info for contact
    const customerRequired = ["name", "email"];
    const customerMissing = [];

    customerRequired.forEach((field) => {
      if (!body.customerInfo[field]) {
        customerMissing.push(`customerInfo.${field}`);
      }
    });

    if (customerMissing.length > 0) {
      return {
        valid: false,
        error: this.handleValidationError(customerMissing),
      };
    }

    return { valid: true };
  }

  validateCommissionRequest(body) {
    const requiredFields = ["customerInfo", "projectDetails"];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return { valid: false, error: this.handleValidationError(missingFields) };
    }

    // Validate customer info for commission
    const customerRequired = ["name", "email"];
    const customerMissing = [];

    customerRequired.forEach((field) => {
      if (!body.customerInfo[field]) {
        customerMissing.push(`customerInfo.${field}`);
      }
    });

    if (customerMissing.length > 0) {
      return {
        valid: false,
        error: this.handleValidationError(customerMissing),
      };
    }

    // Validate project details
    const projectRequired = ["type", "description"];
    const projectMissing = [];

    projectRequired.forEach((field) => {
      if (!body.projectDetails[field]) {
        projectMissing.push(`projectDetails.${field}`);
      }
    });

    if (projectMissing.length > 0) {
      return {
        valid: false,
        error: this.handleValidationError(projectMissing),
      };
    }

    return { valid: true };
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Handle CORS preflight
  handleCorsPreflight(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");

    return res.status(200).json({ message: "CORS preflight successful" });
  }

  // Handle method not allowed
  handleMethodNotAllowed(res) {
    const errorResponse = this.createErrorResponse("METHOD_NOT_ALLOWED");
    res.status(405).json(errorResponse);
  }
}

module.exports = ErrorHandler;

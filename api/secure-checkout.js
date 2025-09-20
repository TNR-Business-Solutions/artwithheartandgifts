require("dotenv").config();
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

module.exports = async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight successful" });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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

    console.log(
      "Received checkout request body:",
      JSON.stringify(body, null, 2)
    );

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
      console.error("Validation failed - missing required fields");
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

    // Validate customer info structure
    if (!customerInfo.email || !customerInfo.firstName) {
      console.error("Validation failed - missing customer email or firstName");
      return res.status(400).json({
        error: "Missing customer email or name",
        details: {
          email: !!customerInfo.email,
          firstName: !!customerInfo.firstName,
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

    // Create transporter with Gmail SMTP settings for Vercel
    const transporter = nodemailer.createTransporter({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Generate order summary HTML
    const generateOrderSummary = () => {
      let itemsHtml = "";
      cartItems.forEach((item, index) => {
        itemsHtml += `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${item.title}</strong><br>
              <small>${item.type} • ${item.size}</small>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      });

      return `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th>#</th>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9f9f9; font-weight: bold;">
              <td colspan="4">Order Total:</td>
              <td>$${totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    };

    // Email to business
    const businessEmailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Secure Order #${orderNumber} - $${totalAmount.toFixed(2)}`,
      html: `
        <h2>New Secure Order Received</h2>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        ${
          referenceNumber
            ? `<p><strong>Reference Number:</strong> ${referenceNumber}</p>`
            : ""
        }
        
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${customerInfo.firstName} ${
        customerInfo.lastName
      }</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        <p><strong>Phone:</strong> ${customerInfo.phone || "Not provided"}</p>
        
        <h3>Shipping Address</h3>
        <p>
          ${customerInfo.address}<br>
          ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}
        </p>
        
        <h3>Order Items</h3>
        ${generateOrderSummary()}
        
        <h3>Payment Information</h3>
        <p><strong>Payment Method:</strong> ${
          paymentInfo.method || "Credit Card"
        }</p>
        <p><strong>Cardholder Name:</strong> ${paymentInfo.cardholderName}</p>
        <p><strong>Card Number:</strong> ${paymentInfo.cardNumber}</p>
        <p><strong>Expiration:</strong> ${paymentInfo.expirationDate}</p>
        <p><strong>Transaction ID:</strong> ${paymentInfo.transactionId}</p>
        <p><strong>Status:</strong> Pending Confirmation</p>
        
        ${
          customerInfo.specialInstructions
            ? `
        <h3>Special Instructions</h3>
        <p>${customerInfo.specialInstructions}</p>
        `
            : ""
        }
        
        <hr>
        <p><em>Secure order from Art with Heart & Gifts website</em></p>
      `,
    };

    // Send email with error handling
    let businessEmailSent = false;

    try {
      console.log("Sending business email to:", process.env.RECIPIENT_EMAIL);
      const businessResult = await transporter.sendMail(businessEmailOptions);
      console.log(
        "Business email sent successfully:",
        businessResult.messageId
      );
      businessEmailSent = true;
    } catch (businessError) {
      console.error("Failed to send business email:", businessError);
      console.error("Business email error details:", businessError.message);
    }

    // Log email sending status
    console.log("Email sending status:", {
      businessEmailSent,
      businessEmail: process.env.RECIPIENT_EMAIL,
      customerEmail: customerInfo.email,
    });

    return res.status(200).json({
      success: true,
      orderId: orderId || orderNumber,
      message: "Order processed successfully!",
      paymentStatus: "pending",
      transactionId: paymentInfo.transactionId,
      emailDelivery: {
        businessEmailSent,
        provider: "gmail",
      },
    });
  } catch (error) {
    console.error("Secure checkout error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      error: "Failed to process order. Please try again later.",
      details: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

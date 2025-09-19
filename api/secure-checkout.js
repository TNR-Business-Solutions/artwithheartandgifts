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
    // Proper Vercel serverless request body handling
    let body;
    if (req.body) {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } else {
      // Handle raw body parsing for Vercel
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
      });
    }

    // Validate payment information
    if (
      !paymentInfo.cardholderName ||
      !paymentInfo.cardNumber ||
      !paymentInfo.expirationDate ||
      !paymentInfo.cvv
    ) {
      return res.status(400).json({
        error: "Missing required payment information",
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

    // Create transporter with Gmail SMTP settings for Vercel (working configuration)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
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

    // Email to customer
    const customerEmailOptions = {
      from: process.env.EMAIL_USER,
      to: customerInfo.email,
      subject: `Order Confirmation #${orderNumber} - Art with Heart & Gifts`,
      html: `
        <h2>Thank You for Your Order!</h2>
        <p>Dear ${customerInfo.firstName},</p>
        
        <p>Your order has been received and is being processed securely.</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        ${
          referenceNumber
            ? `<p><strong>Reference Number:</strong> ${referenceNumber}</p>`
            : ""
        }
        
        <h3>Order Items</h3>
        ${generateOrderSummary()}
        
        <h3>Payment Status</h3>
        <p>Your payment is being processed. You will receive a confirmation email once payment is completed.</p>
        
        <h3>What's Next?</h3>
        <ul>
          <li>Payment confirmation (within 24 hours)</li>
          <li>Order preparation (2-3 business days)</li>
          <li>Shipping notification with tracking</li>
          <li>Careful packaging and delivery</li>
        </ul>
        
        <h3>Questions?</h3>
        <p>If you have any questions about your order, please contact us with order number <strong>${orderNumber}</strong>.</p>
        
        <p>Thank you for supporting local art!</p>
        
        <p>Best regards,<br>
        Art with Heart & Gifts<br>
        <a href="https://artwithheartandgifts.com">artwithheartandgifts.com</a></p>
      `,
    };

    // Send both emails
    console.log("Sending business email to:", process.env.RECIPIENT_EMAIL);
    const businessResult = await transporter.sendMail(businessEmailOptions);
    console.log("Business email sent successfully:", businessResult.messageId);

    console.log("Sending customer confirmation email to:", customerInfo.email);
    const customerResult = await transporter.sendMail(customerEmailOptions);
    console.log(
      "Customer confirmation email sent successfully:",
      customerResult.messageId
    );

    return res.status(200).json({
      success: true,
      orderId: orderId || orderNumber,
      message: "Order processed successfully!",
      paymentStatus: "pending",
      transactionId: paymentInfo.transactionId,
    });
  } catch (error) {
    console.error("Secure checkout error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process order. Please try again later.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

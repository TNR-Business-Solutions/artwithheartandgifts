const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Commission API endpoint
app.post("/api/commission", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      projectType,
      size,
      budget,
      timeline,
      description,
      inspiration,
      location,
    } = req.body;

    // Validate required fields
    if (!name || !email || !projectType || !description) {
      return res.status(400).json({
        error:
          "Missing required fields: name, email, project type, and description are required",
      });
    }

    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Commission Request: ${projectType}`,
      html: `
        <h2>New Commission Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <p><strong>Size:</strong> ${size || "Not specified"}</p>
        <p><strong>Budget Range:</strong> ${budget || "Not specified"}</p>
        <p><strong>Timeline:</strong> ${timeline || "Flexible"}</p>
        <p><strong>Location:</strong> ${location || "Not specified"}</p>
        <p><strong>Project Description:</strong></p>
        <p>${description.replace(/\n/g, "<br>")}</p>
        ${
          inspiration
            ? `
        <p><strong>Inspiration/References:</strong></p>
        <p>${inspiration.replace(/\n/g, "<br>")}</p>
        `
            : ""
        }
        <hr>
        <p><em>Commission request from Art with Heart & Gifts website</em></p>
      `,
      replyTo: email,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to client
    const confirmationOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Commission Request Received - Art with Heart & Gifts",
      html: `
        <h2>Commission Request Received!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your commission request for a <strong>${projectType}</strong>. I'm excited to learn more about your vision!</p>
        
        <h3>Project Details:</h3>
        <ul>
          <li><strong>Type:</strong> ${projectType}</li>
          <li><strong>Size:</strong> ${size || "To be discussed"}</li>
          <li><strong>Budget:</strong> ${budget || "To be discussed"}</li>
          <li><strong>Timeline:</strong> ${timeline || "Flexible"}</li>
        </ul>

        <p>I'll review your request and get back to you within 2-3 business days with:</p>
        <ul>
          <li>Initial concept ideas</li>
          <li>Timeline and pricing</li>
          <li>Next steps for moving forward</li>
        </ul>

        <p>If you have any questions in the meantime, feel free to reach out!</p>
        
        <p>Best regards,<br>
        Art with Heart & Gifts<br>
        <a href="https://artwithheartandgifts.com">artwithheartandgifts.com</a></p>
      `,
    };

    await transporter.sendMail(confirmationOptions);

    return res.status(200).json({
      success: true,
      message: "Commission request submitted successfully!",
    });
  } catch (error) {
    console.error("Commission form error:", error);
    return res.status(500).json({
      error: "Failed to submit commission request. Please try again later.",
    });
  }
});

// Contact API endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Missing required fields: name, email, and message are required",
      });
    }

    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Contact Form: ${subject || "New Message"}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Subject:</strong> ${subject || "No subject"}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><em>Sent from Art with Heart & Gifts contact form</em></p>
      `,
      replyTo: email,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const confirmationOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting Art with Heart & Gifts",
      html: `
        <h2>Thank you for your message!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to Art with Heart & Gifts. I've received your message and will get back to you as soon as possible.</p>
        <p>Your message:</p>
        <p><em>"${message}"</em></p>
        <p>Best regards,<br>
        Art with Heart & Gifts<br>
        <a href="https://artwithheartandgifts.com">artwithheartandgifts.com</a></p>
      `,
    };

    await transporter.sendMail(confirmationOptions);

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
    });
  }
});

// Orders API endpoint
app.post("/api/orders", async (req, res) => {
  try {
    const { customerInfo, cartItems, paymentInfo, totalAmount, orderId } =
      req.body;

    // Validate required fields
    if (!customerInfo || !cartItems || !totalAmount) {
      return res.status(400).json({
        error: "Missing required order information",
      });
    }

    const orderNumber =
      orderId || `AWH-${uuidv4().substring(0, 8).toUpperCase()}`;
    const orderDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const transporter = createTransporter();

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
      subject: `New Order #${orderNumber} - $${totalAmount.toFixed(2)}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        
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
        <p><strong>Transaction ID:</strong> ${
          paymentInfo.transactionId || "Processing"
        }</p>
        
        ${
          customerInfo.specialInstructions
            ? `
        <h3>Special Instructions</h3>
        <p>${customerInfo.specialInstructions}</p>
        `
            : ""
        }
        
        <hr>
        <p><em>Order from Art with Heart & Gifts website</em></p>
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
        
        <p>Your order has been received and is being processed. We're excited to prepare your art for you!</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        
        <h3>Order Items</h3>
        ${generateOrderSummary()}
        
        <h3>What's Next?</h3>
        <ul>
          <li>We'll prepare your order within 2-3 business days</li>
          <li>You'll receive a shipping notification with tracking information</li>
          <li>Your art will be carefully packaged and shipped</li>
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
    await transporter.sendMail(businessEmailOptions);
    await transporter.sendMail(customerEmailOptions);

    return res.status(200).json({
      success: true,
      orderId: orderNumber,
      message: "Order processed successfully!",
    });
  } catch (error) {
    console.error("Order processing error:", error);
    return res.status(500).json({
      error: "Failed to process order. Please try again later.",
    });
  }
});

// Payment completion API endpoint
app.post("/api/payment/complete", async (req, res) => {
  try {
    const { orderId, status, transactionId, customerEmail } = req.body;

    // Validate required fields
    if (!orderId || !status) {
      return res.status(400).json({
        error: "Missing required fields: orderId and status are required",
      });
    }

    const transporter = createTransporter();

    if (status === "completed") {
      // Send payment confirmation email to customer
      const confirmationOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: `Payment Confirmed - Order #${orderId}`,
        html: `
          <h2>Payment Confirmed!</h2>
          <p>Your payment for Order #${orderId} has been successfully processed.</p>
          
          ${
            transactionId
              ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>`
              : ""
          }
          
          <h3>What's Next?</h3>
          <ul>
            <li>We'll prepare your order within 2-3 business days</li>
            <li>You'll receive a shipping notification with tracking information</li>
            <li>Your art will be carefully packaged and shipped</li>
          </ul>
          
          <p>Thank you for your purchase!</p>
          
          <p>Best regards,<br>
          Art with Heart & Gifts<br>
          <a href="https://artwithheartandgifts.com">artwithheartandgifts.com</a></p>
        `,
      };

      await transporter.sendMail(confirmationOptions);
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Payment completion error:", error);
    return res.status(500).json({
      error: "Failed to process payment completion. Please try again later.",
    });
  }
});

// Secure checkout API endpoint
app.post("/api/secure-checkout", async (req, res) => {
  try {
    const {
      customerInfo,
      cartItems,
      paymentMethod,
      totalAmount,
      referenceNumber,
    } = req.body;

    // Validate required fields
    if (!customerInfo || !cartItems || !totalAmount) {
      return res.status(400).json({
        error: "Missing required checkout information",
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

    const transporter = createTransporter();

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
          paymentMethod || "Credit Card"
        }</p>
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
    await transporter.sendMail(businessEmailOptions);
    await transporter.sendMail(customerEmailOptions);

    return res.status(200).json({
      success: true,
      orderId: orderNumber,
      message: "Order processed successfully!",
    });
  } catch (error) {
    console.error("Secure checkout error:", error);
    return res.status(500).json({
      error: "Failed to process order. Please try again later.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📧 Email functionality enabled`);
  console.log(`🔧 API endpoints ready for testing`);
});

const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  // Set CORS headers
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

    console.log("API request received:", JSON.stringify(body, null, 2));

    // Detect form type and handle appropriately
    if (body.name && body.email && body.message && !body.projectType) {
      // Contact form (direct form data)
      return await handleContactForm(req, res, body);
    } else if (body.name && body.email && body.projectType) {
      // Commission form (direct form data)
      return await handleCommissionForm(req, res, body);
    } else if (body.customerInfo && body.cartItems) {
      // Checkout form (structured data)
      return await handleCheckoutForm(req, res, body);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid request format",
        details: "Unable to determine form type",
        receivedData: Object.keys(body)
      });
    }

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Contact Form Handler
async function handleContactForm(req, res, body) {
  console.log("Handling contact form submission");
  
  const { name, email, phone, subject, message } = body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: "Missing required contact information"
    });
  }

  const messageId = `CONTACT-${Date.now()}`;
  
  // Send email
  const emailSent = await sendEmail({
    to: process.env.RECIPIENT_EMAIL,
    subject: subject || `Contact Form Submission from ${name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
      <hr>
      <p><em>Sent via Art with Heart & Gifts contact form</em></p>
    `
  });

  return res.status(200).json({
    success: true,
    messageId: messageId,
    customerInfo: {
      name: name,
      email: email,
    },
    emailDelivery: emailSent,
  });
}

// Commission Form Handler  
async function handleCommissionForm(req, res, body) {
  console.log("Handling commission form submission");
  
  const { name, email, phone, projectType, size, budget, timeline, location, description, inspiration } = body;
  
  if (!name || !email || !description) {
    return res.status(400).json({
      success: false,
      error: "Missing required commission information"
    });
  }

  const messageId = `COMMISSION-${Date.now()}`;
  
  // Send email
  const emailSent = await sendEmail({
    to: process.env.RECIPIENT_EMAIL,
    subject: `Commission Request from ${name}`,
    html: `
      <h2>New Commission Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      
      <h3>Project Details</h3>
      <p><strong>Type:</strong> ${projectType || "Not specified"}</p>
      <p><strong>Size:</strong> ${size || "Not specified"}</p>
      <p><strong>Budget:</strong> ${budget || "Not specified"}</p>
      <p><strong>Timeline:</strong> ${timeline || "Not specified"}</p>
      <p><strong>Location:</strong> ${location || "Not specified"}</p>
      
      <h3>Description</h3>
      <p>${description.replace(/\n/g, "<br>")}</p>
      
      ${inspiration ? `
      <h3>Inspiration</h3>
      <p>${inspiration.replace(/\n/g, "<br>")}</p>
      ` : ""}
      
      <hr>
      <p><em>Sent via Art with Heart & Gifts commission form</em></p>
    `
  });

  return res.status(200).json({
    success: true,
    messageId: messageId,
    customerInfo: {
      name: name,
      email: email,
    },
    projectDetails: {
      type: projectType,
      size: size,
      budget: budget,
    },
    emailDelivery: emailSent,
  });
}

// Checkout Form Handler
async function handleCheckoutForm(req, res, body) {
  console.log("Handling checkout form submission");
  
  const { customerInfo, cartItems, paymentInfo, totalAmount, orderId, referenceNumber } = body;

  // Basic validation
  if (!customerInfo || !cartItems || !totalAmount || !paymentInfo) {
    return res.status(400).json({
      success: false,
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

  // Send business email
  const businessEmailSent = await sendEmail({
    to: process.env.RECIPIENT_EMAIL,
    subject: `New Order #${orderNumber} - $${totalAmount.toFixed(2)}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Order Date:</strong> ${orderDate}</p>
      <p><strong>Customer:</strong> ${customerInfo.firstName} ${customerInfo.lastName || ""}</p>
      <p><strong>Email:</strong> ${customerInfo.email}</p>
      <p><strong>Phone:</strong> ${customerInfo.phone || "Not provided"}</p>
      <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
      <p><strong>Transaction ID:</strong> ${paymentInfo.transactionId}</p>
      ${referenceNumber ? `<p><strong>Reference:</strong> ${referenceNumber}</p>` : ""}
      <hr>
      <p><em>Order from Art with Heart & Gifts</em></p>
    `
  });

  // Send customer confirmation email
  const customerEmailSent = await sendEmail({
    to: customerInfo.email,
    subject: `Order Confirmation #${orderNumber} - Art with Heart & Gifts`,
    html: `
      <h2>Thank You for Your Order!</h2>
      <p>Dear ${customerInfo.firstName},</p>
      <p>Your order has been received and is being processed.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Order Date:</strong> ${orderDate}</p>
      <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
      <p>We'll contact you within 24 hours with payment and shipping details.</p>
      <p>Thank you for supporting local art!</p>
      <p>Best regards,<br>Art with Heart & Gifts</p>
    `
  });

  return res.status(200).json({
    success: true,
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
      businessEmail: businessEmailSent,
      customerEmail: customerEmailSent,
      provider: businessEmailSent.provider || customerEmailSent.provider,
    },
  });
}

// Email sending helper function
async function sendEmail({ to, subject, html }) {
  // Try Gmail SMTP first
  try {
    const transporter = nodemailer.createTransporter({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    });

    console.log(`Gmail email sent successfully to ${to}:`, result.messageId);
    return {
      success: true,
      provider: "gmail",
      messageId: result.messageId,
    };
  } catch (gmailError) {
    console.log(`Gmail failed for ${to}, trying FormSubmit:`, gmailError.message);

    // Try FormSubmit as fallback
    try {
      const formData = {
        _subject: subject,
        _template: "table",
        _captcha: "false",
        email_to: to,
        email_subject: subject,
        email_content: html.replace(/<[^>]*>/g, ''), // Strip HTML for FormSubmit
        timestamp: new Date().toISOString(),
      };

      const formResponse = await fetch("https://formsubmit.co/ajax/Artwithheartandgiftsllc@gmail.com", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://artwithheartandgifts.com",
          "Origin": "https://artwithheartandgifts.com"
        },
        body: JSON.stringify(formData)
      });

      if (formResponse.ok) {
        console.log(`FormSubmit email sent successfully to business for ${to}`);
        return {
          success: true,
          provider: "formsubmit",
          messageId: `formsubmit-${Date.now()}`,
        };
      } else {
        throw new Error(`FormSubmit failed: ${formResponse.status}`);
      }
    } catch (formError) {
      console.error(`All email methods failed for ${to}:`, formError.message);
      return {
        success: false,
        provider: "none",
        error: `Gmail: ${gmailError.message}; FormSubmit: ${formError.message}`,
      };
    }
  }
}
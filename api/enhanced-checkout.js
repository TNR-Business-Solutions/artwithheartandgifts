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

    console.log("Enhanced checkout request:", JSON.stringify(body, null, 2));

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

    // Try Gmail SMTP first
    let emailSent = false;
    let emailProvider = "none";
    let emailError = "";

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

      const mailOptions = {
        from: process.env.EMAIL_USER,
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
          <hr>
          <p><em>Order from Art with Heart & Gifts</em></p>
        `,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      emailProvider = "gmail";
      console.log("Gmail email sent successfully");
    } catch (gmailError) {
      console.log("Gmail failed, trying FormSubmit:", gmailError.message);
      emailError = gmailError.message;

      // Try FormSubmit as fallback
      try {
        const formData = {
          _subject: `New Order #${orderNumber} - $${totalAmount.toFixed(2)}`,
          _template: "table",
          _captcha: "false",
          order_number: orderNumber,
          customer_name: `${customerInfo.firstName} ${customerInfo.lastName || ""}`,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone || "Not provided",
          total_amount: `$${totalAmount.toFixed(2)}`,
          transaction_id: paymentInfo.transactionId,
          order_date: orderDate,
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
          const formResult = await formResponse.json();
          if (formResult.success === "true") {
            emailSent = true;
            emailProvider = "formsubmit";
            console.log("FormSubmit email sent successfully");
          }
        }
      } catch (formError) {
        console.log("FormSubmit also failed:", formError.message);
        emailError += "; FormSubmit: " + formError.message;
      }
    }

    // Return success response (even if email fails, order is processed)
    return res.status(200).json({
      success: true,
      orderId: orderId || orderNumber,
      orderNumber,
      orderDate,
      message: "Order processed successfully!",
      paymentStatus: "pending",
      transactionId: paymentInfo.transactionId,
      emailDelivery: {
        success: emailSent,
        provider: emailProvider,
        error: emailSent ? null : emailError,
      },
      customerInfo: {
        name: `${customerInfo.firstName} ${customerInfo.lastName || ""}`,
        email: customerInfo.email,
      },
      totalAmount,
    });

  } catch (error) {
    console.error("Enhanced checkout error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process order. Please try again later.",
      details: error.message,
      code: error.code,
    });
  }
};
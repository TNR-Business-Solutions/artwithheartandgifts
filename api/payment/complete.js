const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, status, transactionId, customerEmail } = req.body;

    // Validate required fields
    if (!orderId || !status) {
      return res.status(400).json({
        error: "Missing required fields: orderId and status are required",
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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
};

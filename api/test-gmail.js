const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Testing Gmail SMTP connection...");
    console.log("EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "NOT SET");
    console.log(
      "EMAIL_PASS:",
      process.env.EMAIL_PASS
        ? "SET (length: " + process.env.EMAIL_PASS.length + ")"
        : "NOT SET"
    );
    console.log(
      "RECIPIENT_EMAIL:",
      process.env.RECIPIENT_EMAIL ? "SET" : "NOT SET"
    );

    // Create transporter with Gmail SMTP settings
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
      logger: true,
      debug: true,
    });

    // Verify connection
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    // Send test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Gmail SMTP Test - " + new Date().toLocaleString(),
      html: `
        <h2>Gmail SMTP Test Successful!</h2>
        <p>This is a test email to verify Gmail SMTP configuration is working.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>To:</strong> ${process.env.RECIPIENT_EMAIL}</p>
        <p>If you receive this email, the Gmail SMTP configuration is working correctly!</p>
      `,
    };

    console.log("Sending test email...");
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
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Error response:", error.response);

    return res.status(500).json({
      error: "Gmail SMTP test failed",
      details: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
  }
};

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

    const { name, email, subject, message, phone } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Missing required fields: name, email, and message are required",
      });
    }

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
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Environment variables check:");
    console.error("EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "NOT SET");
    console.error("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
    console.error(
      "RECIPIENT_EMAIL:",
      process.env.RECIPIENT_EMAIL ? "SET" : "NOT SET"
    );

    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
      details: error.message,
      code: error.code,
    });
  }
};

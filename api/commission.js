import nodemailer from "nodemailer";

export default async function handler(req, res) {
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
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      // Handle raw body parsing for Vercel
      const rawBody = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
      body = JSON.parse(rawBody);
    }
    
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
    } = body;

    // Validate required fields
    if (!name || !email || !projectType || !description) {
      return res.status(400).json({
        error:
          "Missing required fields: name, email, project type, and description are required",
      });
    }

    // Create transporter with correct Yahoo SMTP settings for Vercel
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.yahoo.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

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
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to submit commission request. Please try again later.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

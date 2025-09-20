require("dotenv").config();
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class GmailProvider {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
      logger.email("gmail", "INITIALIZED", "Gmail transporter created");
    } catch (error) {
      logger.email("gmail", false, `Failed to initialize: ${error.message}`);
      throw error;
    }
  }

  async verify() {
    if (!this.transporter) {
      throw new Error("Gmail transporter not initialized");
    }

    try {
      await this.transporter.verify();
      logger.email("gmail", true, "SMTP connection verified");
      return true;
    } catch (error) {
      logger.email(
        "gmail",
        false,
        `SMTP verification failed: ${error.message}`
      );
      throw error;
    }
  }

  async sendOrderEmails({ businessEmail, customerEmail, orderData }) {
    if (!this.transporter) {
      throw new Error("Gmail transporter not initialized");
    }

    try {
      // Set the from field for Gmail
      const businessEmailWithFrom = {
        ...businessEmail,
        from: process.env.EMAIL_USER,
      };

      const customerEmailWithFrom = {
        ...customerEmail,
        from: process.env.EMAIL_USER,
      };

      logger.email(
        "gmail",
        "ATTEMPT",
        `Sending business email to ${businessEmail.to}`
      );
      const businessResult = await this.transporter.sendMail(
        businessEmailWithFrom
      );
      logger.email(
        "gmail",
        true,
        `Business email sent: ${businessResult.messageId}`
      );

      logger.email(
        "gmail",
        "ATTEMPT",
        `Sending customer email to ${customerEmail.to}`
      );
      const customerResult = await this.transporter.sendMail(
        customerEmailWithFrom
      );
      logger.email(
        "gmail",
        true,
        `Customer email sent: ${customerResult.messageId}`
      );

      return {
        success: true,
        messageId: businessResult.messageId,
        businessMessageId: businessResult.messageId,
        customerMessageId: customerResult.messageId,
        details:
          "Both business and customer emails sent successfully via Gmail SMTP",
      };
    } catch (error) {
      logger.email("gmail", false, `Failed to send emails: ${error.message}`);
      throw new Error(`Gmail email sending failed: ${error.message}`);
    }
  }

  async sendContactEmail({ customerInfo, message, subject }) {
    if (!this.transporter) {
      throw new Error("Gmail transporter not initialized");
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECIPIENT_EMAIL,
        subject: subject || `Contact Form Submission from ${customerInfo.name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${customerInfo.name}</p>
          <p><strong>Email:</strong> ${customerInfo.email}</p>
          <p><strong>Phone:</strong> ${customerInfo.phone || "Not provided"}</p>
          <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p><em>Sent via Art with Heart & Gifts contact form</em></p>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.email("gmail", true, `Contact email sent: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
        details: "Contact email sent successfully via Gmail SMTP",
      };
    } catch (error) {
      logger.email("gmail", false, `Contact email failed: ${error.message}`);
      throw new Error(`Gmail contact email failed: ${error.message}`);
    }
  }

  async sendCommissionEmail({ customerInfo, projectDetails }) {
    if (!this.transporter) {
      throw new Error("Gmail transporter not initialized");
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECIPIENT_EMAIL,
        subject: `Commission Request from ${customerInfo.name}`,
        html: `
          <h2>New Commission Request</h2>
          <p><strong>Name:</strong> ${customerInfo.name}</p>
          <p><strong>Email:</strong> ${customerInfo.email}</p>
          <p><strong>Phone:</strong> ${customerInfo.phone || "Not provided"}</p>
          
          <h3>Project Details</h3>
          <p><strong>Type:</strong> ${projectDetails.type}</p>
          <p><strong>Size:</strong> ${projectDetails.size}</p>
          <p><strong>Budget:</strong> ${projectDetails.budget}</p>
          <p><strong>Timeline:</strong> ${projectDetails.timeline}</p>
          <p><strong>Location:</strong> ${projectDetails.location}</p>
          
          <h3>Description</h3>
          <p>${projectDetails.description.replace(/\n/g, "<br>")}</p>
          
          ${
            projectDetails.inspiration
              ? `
          <h3>Inspiration</h3>
          <p>${projectDetails.inspiration.replace(/\n/g, "<br>")}</p>
          `
              : ""
          }
          
          <hr>
          <p><em>Sent via Art with Heart & Gifts commission form</em></p>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.email("gmail", true, `Commission email sent: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
        details: "Commission email sent successfully via Gmail SMTP",
      };
    } catch (error) {
      logger.email("gmail", false, `Commission email failed: ${error.message}`);
      throw new Error(`Gmail commission email failed: ${error.message}`);
    }
  }
}

module.exports = GmailProvider;

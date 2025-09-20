const logger = require("../utils/logger");

class MailtoProvider {
  constructor() {
    logger.email(
      "mailto",
      "INITIALIZED",
      "Mailto provider initialized"
    );
  }

  async verify() {
    // Mailto is always available
    logger.email(
      "mailto",
      true,
      "Mailto verification (always available)"
    );
    return true;
  }

  async sendOrderEmails({ businessEmail, customerEmail, orderData }) {
    try {
      const {
        customerInfo,
        cartItems,
        totalAmount,
        orderNumber,
        orderDate,
        referenceNumber,
      } = orderData;

      // Create a comprehensive email body
      const emailBody = `
NEW ORDER RECEIVED - ${orderNumber}

Order Details:
- Order Number: ${orderNumber}
- Order Date: ${orderDate}
- Reference: ${referenceNumber || 'N/A'}
- Total Amount: $${totalAmount.toFixed(2)}

Customer Information:
- Name: ${customerInfo.firstName} ${customerInfo.lastName || ''}
- Email: ${customerInfo.email}
- Phone: ${customerInfo.phone || 'Not provided'}
- Address: ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}

Order Items:
${cartItems.map((item, index) => 
  `${index + 1}. ${item.title} (${item.type}, ${item.size}) - $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

Payment Information:
- Cardholder: ${orderData.paymentInfo.cardholderName}
- Card: ****${orderData.paymentInfo.cardNumber.slice(-4)}
- Expires: ${orderData.paymentInfo.expirationDate}
- Transaction ID: ${orderData.paymentInfo.transactionId}

Special Instructions:
${customerInfo.specialInstructions || 'None'}

---
This email was generated automatically by the Art with Heart & Gifts order system.
Please process this order and contact the customer for any questions.
      `.trim();

      // Log the email content for manual processing
      logger.order(
        orderNumber,
        "EMAIL_FALLBACK",
        "Email content logged for manual processing"
      );
      
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL FALLBACK - MANUAL PROCESSING REQUIRED');
      console.log('='.repeat(80));
      console.log(`TO: ${process.env.RECIPIENT_EMAIL}`);
      console.log(`SUBJECT: ${businessEmail.subject}`);
      console.log('='.repeat(80));
      console.log(emailBody);
      console.log('='.repeat(80));
      console.log('📧 END EMAIL CONTENT');
      console.log('='.repeat(80) + '\n');

      // For now, we'll consider this "successful" since we've logged the content
      logger.email("mailto", true, "Email content logged for manual processing");

      return {
        success: true,
        messageId: `mailto-fallback-${Date.now()}`,
        businessMessageId: `mailto-business-${Date.now()}`,
        customerMessageId: `mailto-customer-${Date.now()}`,
        details: "Email content logged for manual processing - check server console",
      };
    } catch (error) {
      logger.email(
        "mailto",
        false,
        `Failed to process email: ${error.message}`
      );
      throw new Error(`Mailto fallback failed: ${error.message}`);
    }
  }

  async sendContactEmail({ customerInfo, message, subject }) {
    try {
      const emailBody = `
CONTACT FORM SUBMISSION

From: ${customerInfo.name}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone || 'Not provided'}
Subject: ${subject || 'General Inquiry'}

Message:
${message}

---
Submitted at: ${new Date().toISOString()}
      `.trim();

      console.log('\n' + '='.repeat(80));
      console.log('📧 CONTACT EMAIL - MANUAL PROCESSING REQUIRED');
      console.log('='.repeat(80));
      console.log(`TO: ${process.env.RECIPIENT_EMAIL}`);
      console.log(`SUBJECT: Contact Form - ${subject || 'General Inquiry'}`);
      console.log('='.repeat(80));
      console.log(emailBody);
      console.log('='.repeat(80) + '\n');

      logger.email("mailto", true, "Contact email content logged");

      return {
        success: true,
        messageId: `mailto-contact-${Date.now()}`,
        details: "Contact email content logged for manual processing",
      };
    } catch (error) {
      logger.email(
        "mailto",
        false,
        `Contact email failed: ${error.message}`
      );
      throw new Error(`Mailto contact email failed: ${error.message}`);
    }
  }

  async sendCommissionEmail({ customerInfo, projectDetails }) {
    try {
      const emailBody = `
COMMISSION REQUEST

Customer Information:
- Name: ${customerInfo.name}
- Email: ${customerInfo.email}
- Phone: ${customerInfo.phone || 'Not provided'}

Project Details:
- Type: ${projectDetails.type}
- Size: ${projectDetails.size}
- Budget: ${projectDetails.budget}
- Timeline: ${projectDetails.timeline}
- Location: ${projectDetails.location}

Description:
${projectDetails.description}

Inspiration:
${projectDetails.inspiration || 'Not provided'}

---
Submitted at: ${new Date().toISOString()}
      `.trim();

      console.log('\n' + '='.repeat(80));
      console.log('📧 COMMISSION EMAIL - MANUAL PROCESSING REQUIRED');
      console.log('='.repeat(80));
      console.log(`TO: ${process.env.RECIPIENT_EMAIL}`);
      console.log(`SUBJECT: Commission Request from ${customerInfo.name}`);
      console.log('='.repeat(80));
      console.log(emailBody);
      console.log('='.repeat(80) + '\n');

      logger.email("mailto", true, "Commission email content logged");

      return {
        success: true,
        messageId: `mailto-commission-${Date.now()}`,
        details: "Commission email content logged for manual processing",
      };
    } catch (error) {
      logger.email(
        "mailto",
        false,
        `Commission email failed: ${error.message}`
      );
      throw new Error(`Mailto commission email failed: ${error.message}`);
    }
  }
}

module.exports = MailtoProvider;

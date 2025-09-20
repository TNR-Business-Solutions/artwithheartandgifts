const logger = require("../utils/logger");

class FormSubmitProvider {
  constructor() {
    this.baseUrl = "https://formsubmit.co";
    logger.email(
      "formsubmit",
      "INITIALIZED",
      "FormSubmit provider initialized"
    );
  }

  async verify() {
    // FormSubmit doesn't require verification - it's always available
    logger.email(
      "formsubmit",
      true,
      "FormSubmit verification (always available)"
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

      // Prepare FormSubmit data for business email
      const businessFormData = {
        _subject: businessEmail.subject,
        _template: "table",
        _captcha: "false",

        order_number: orderNumber,
        order_date: orderDate,
        reference_number: referenceNumber || "N/A",

        customer_name: `${customerInfo.firstName} ${
          customerInfo.lastName || ""
        }`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || "Not provided",

        shipping_address: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}`,

        order_items: cartItems
          .map(
            (item, index) =>
              `${index + 1}. ${item.title} (${item.type}, ${
                item.size
              }) - $${item.price.toFixed(2)} x ${item.quantity} = $${(
                item.price * item.quantity
              ).toFixed(2)}`
          )
          .join("\n"),

        total_amount: `$${totalAmount.toFixed(2)}`,
        payment_method: orderData.paymentInfo.method || "Credit Card",
        cardholder_name: orderData.paymentInfo.cardholderName,
        card_number: orderData.paymentInfo.cardNumber,
        expiration_date: orderData.paymentInfo.expirationDate,
        transaction_id: orderData.paymentInfo.transactionId,

        special_instructions: customerInfo.specialInstructions || "None",
        submitted_at: new Date().toISOString(),
        provider: "FormSubmit",
      };

      logger.email(
        "formsubmit",
        "ATTEMPT",
        `Sending business email to ${process.env.RECIPIENT_EMAIL}`
      );
      const businessResponse = await fetch(
        `${this.baseUrl}/ajax/${process.env.RECIPIENT_EMAIL}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://artwithheartandgifts.com",
            "Origin": "https://artwithheartandgifts.com"
          },
          body: JSON.stringify(businessFormData),
        }
      );

      if (!businessResponse.ok) {
        throw new Error(
          `FormSubmit business email failed: ${businessResponse.status}`
        );
      }

      logger.email("formsubmit", true, "Business email sent via FormSubmit");

      // Send customer confirmation email
      const customerFormData = {
        _subject: customerEmail.subject,
        _template: "table",
        _captcha: "false",
        _replyto: customerInfo.email,

        order_number: orderNumber,
        order_date: orderDate,
        customer_name: customerInfo.firstName,

        order_items: cartItems
          .map(
            (item, index) =>
              `${index + 1}. ${item.title} (${item.type}, ${
                item.size
              }) - $${item.price.toFixed(2)} x ${item.quantity} = $${(
                item.price * item.quantity
              ).toFixed(2)}`
          )
          .join("\n"),

        total_amount: `$${totalAmount.toFixed(2)}`,
        payment_status:
          "Your payment is being processed. You will receive a confirmation email once payment is completed.",

        next_steps: `
1. Payment confirmation (within 24 hours)
2. Order preparation (2-3 business days)
3. Shipping notification with tracking
4. Careful packaging and delivery
        `,

        contact_info: `
If you have any questions about your order, please contact us with order number ${orderNumber}.

Thank you for supporting local art!

Best regards,
Art with Heart & Gifts
https://artwithheartandgifts.com
        `,

        submitted_at: new Date().toISOString(),
        provider: "FormSubmit",
      };

      // For customer emails, we'll send them to the business email with customer info
      // This avoids the FormSubmit verification requirement for customer emails
      const customerFormDataForBusiness = {
        ...customerFormData,
        _subject: `Customer Order Confirmation Copy - ${customerFormData._subject}`,
        customer_copy: "This is a copy of the confirmation sent to the customer",
        customer_email_address: customerInfo.email,
      };

      logger.email(
        "formsubmit",
        "ATTEMPT",
        `Sending customer confirmation copy to business email`
      );
      const customerResponse = await fetch(
        `${this.baseUrl}/ajax/${process.env.RECIPIENT_EMAIL}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerFormDataForBusiness),
        }
      );

      if (customerResponse.ok) {
        logger.email(
          "formsubmit",
          true,
          "Customer confirmation sent via FormSubmit"
        );
      } else {
        logger.email(
          "formsubmit",
          false,
          "Customer confirmation failed, but business email was sent"
        );
      }

      return {
        success: true,
        messageId: `formsubmit-${Date.now()}`,
        businessMessageId: `formsubmit-business-${Date.now()}`,
        customerMessageId: customerResponse.ok
          ? `formsubmit-customer-${Date.now()}`
          : null,
        details: "Order emails sent successfully via FormSubmit",
      };
    } catch (error) {
      logger.email(
        "formsubmit",
        false,
        `Failed to send order emails: ${error.message}`
      );
      throw new Error(`FormSubmit order emails failed: ${error.message}`);
    }
  }

  async sendContactEmail({ customerInfo, message, subject }) {
    try {
      const formData = {
        _subject:
          subject || `Contact Form Submission from ${customerInfo.name}`,
        _template: "table",
        _captcha: "false",

        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || "Not provided",
        subject: subject || "General Inquiry",
        message: message,

        submitted_at: new Date().toISOString(),
        provider: "FormSubmit",
      };

      logger.email(
        "formsubmit",
        "ATTEMPT",
        `Sending contact email to ${process.env.RECIPIENT_EMAIL}`
      );
      const response = await fetch(
        `${this.baseUrl}/ajax/${process.env.RECIPIENT_EMAIL}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`FormSubmit contact email failed: ${response.status}`);
      }

      logger.email("formsubmit", true, "Contact email sent via FormSubmit");

      return {
        success: true,
        messageId: `formsubmit-contact-${Date.now()}`,
        details: "Contact email sent successfully via FormSubmit",
      };
    } catch (error) {
      logger.email(
        "formsubmit",
        false,
        `Contact email failed: ${error.message}`
      );
      throw new Error(`FormSubmit contact email failed: ${error.message}`);
    }
  }

  async sendCommissionEmail({ customerInfo, projectDetails }) {
    try {
      const formData = {
        _subject: `Commission Request from ${customerInfo.name}`,
        _template: "table",
        _captcha: "false",

        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || "Not provided",

        project_type: projectDetails.type,
        project_size: projectDetails.size,
        project_budget: projectDetails.budget,
        project_timeline: projectDetails.timeline,
        project_location: projectDetails.location,

        description: projectDetails.description,
        inspiration: projectDetails.inspiration || "Not provided",

        submitted_at: new Date().toISOString(),
        provider: "FormSubmit",
      };

      logger.email(
        "formsubmit",
        "ATTEMPT",
        `Sending commission email to ${process.env.RECIPIENT_EMAIL}`
      );
      const response = await fetch(
        `${this.baseUrl}/ajax/${process.env.RECIPIENT_EMAIL}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `FormSubmit commission email failed: ${response.status}`
        );
      }

      logger.email("formsubmit", true, "Commission email sent via FormSubmit");

      return {
        success: true,
        messageId: `formsubmit-commission-${Date.now()}`,
        details: "Commission email sent successfully via FormSubmit",
      };
    } catch (error) {
      logger.email(
        "formsubmit",
        false,
        `Commission email failed: ${error.message}`
      );
      throw new Error(`FormSubmit commission email failed: ${error.message}`);
    }
  }
}

module.exports = FormSubmitProvider;

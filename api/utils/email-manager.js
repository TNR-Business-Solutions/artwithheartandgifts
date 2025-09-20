require("dotenv").config();
const GmailProvider = require("../providers/gmail-provider");
const FormSubmitProvider = require("../providers/formsubmit-provider");
const MailtoProvider = require("../providers/mailto-provider");
const logger = require("./logger");

class EmailManager {
  constructor() {
    this.providers = [
      {
        name: "gmail",
        handler: new GmailProvider(),
        priority: 1,
        enabled: true,
      },
      {
        name: "formsubmit",
        handler: new FormSubmitProvider(),
        priority: 2,
        enabled: true,
      },
      {
        name: "mailto",
        handler: new MailtoProvider(),
        priority: 3,
        enabled: true,
      },
    ];

    // Sort providers by priority
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  async sendOrderEmails(orderData) {
    const {
      customerInfo,
      cartItems,
      totalAmount,
      orderNumber,
      orderDate,
      referenceNumber,
    } = orderData;

    logger.order(orderNumber, "STARTED", "Attempting to send order emails");

    // Generate email content
    const emailContent = this.generateEmailContent(orderData);

    // Try each provider until one succeeds
    for (const provider of this.providers) {
      if (!provider.enabled) {
        logger.email(provider.name, false, "Provider disabled, skipping");
        continue;
      }

      try {
        logger.email(provider.name, "ATTEMPT", "Trying to send emails");

        const result = await provider.handler.sendOrderEmails({
          businessEmail: emailContent.business,
          customerEmail: emailContent.customer,
          orderData: orderData,
        });

        logger.email(provider.name, true, "Emails sent successfully");
        logger.order(
          orderNumber,
          "COMPLETED",
          `Emails sent via ${provider.name}`
        );

        return {
          success: true,
          provider: provider.name,
          messageId: result.messageId,
          details: `Order emails sent successfully via ${provider.name}`,
        };
      } catch (error) {
        logger.email(provider.name, false, error.message);
        logger.order(
          orderNumber,
          "PROVIDER_FAILED",
          `${provider.name}: ${error.message}`
        );

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    logger.order(orderNumber, "FAILED", "All email providers failed");
    throw new Error("All email providers failed. Unable to send order emails.");
  }

  generateEmailContent(orderData) {
    const {
      customerInfo,
      cartItems,
      totalAmount,
      orderNumber,
      orderDate,
      referenceNumber,
    } = orderData;

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

    const businessEmail = {
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Order #${orderNumber} - $${totalAmount.toFixed(2)}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        ${
          referenceNumber
            ? `<p><strong>Reference Number:</strong> ${referenceNumber}</p>`
            : ""
        }
        
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${customerInfo.firstName} ${
        customerInfo.lastName || ""
      }</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        <p><strong>Phone:</strong> ${customerInfo.phone || "Not provided"}</p>
        
        <h3>Shipping Address</h3>
        <p>${customerInfo.address}<br>${customerInfo.city}, ${
        customerInfo.state
      } ${customerInfo.zipCode}</p>
        
        <h3>Order Items</h3>
        ${generateOrderSummary()}
        
        <h3>Payment Information</h3>
        <p><strong>Cardholder Name:</strong> ${
          orderData.paymentInfo.cardholderName
        }</p>
        <p><strong>Card Number:</strong> ${orderData.paymentInfo.cardNumber}</p>
        <p><strong>Expiration:</strong> ${
          orderData.paymentInfo.expirationDate
        }</p>
        <p><strong>Transaction ID:</strong> ${
          orderData.paymentInfo.transactionId
        }</p>
        
        ${
          customerInfo.specialInstructions
            ? `<h3>Special Instructions</h3><p>${customerInfo.specialInstructions}</p>`
            : ""
        }
      `,
    };

    const customerEmail = {
      to: customerInfo.email,
      subject: `Order Confirmation #${orderNumber} - Art with Heart & Gifts`,
      html: `
        <h2>Thank You for Your Order!</h2>
        <p>Dear ${customerInfo.firstName},</p>
        <p>Your order has been received and is being processed securely.</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        
        <h3>Order Items</h3>
        ${generateOrderSummary()}
        
        <p>Thank you for supporting local art!</p>
        <p>Best regards,<br>Art with Heart & Gifts</p>
      `,
    };

    return { business: businessEmail, customer: customerEmail };
  }

  async testProvider(providerName) {
    const provider = this.providers.find((p) => p.name === providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    try {
      await provider.handler.verify();
      return { success: true, provider: providerName };
    } catch (error) {
      return { success: false, provider: providerName, error: error.message };
    }
  }

  getProviderStatus() {
    return this.providers.map((provider) => ({
      name: provider.name,
      enabled: provider.enabled,
      priority: provider.priority,
    }));
  }
}

module.exports = EmailManager;

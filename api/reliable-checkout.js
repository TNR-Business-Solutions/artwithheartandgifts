require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

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

    const { customerInfo, cartItems, totalAmount, paymentInfo } = body;

    // Generate order ID
    const orderId = "AWH-" + uuidv4().substring(0, 8).toUpperCase();
    const timestamp = new Date().toISOString();

    // Create email content
    const emailContent = `
🎨 NEW ORDER RECEIVED! 🎨

Order Number: ${orderId}
Date: ${new Date().toLocaleString()}

👤 CUSTOMER INFORMATION:
Name: ${customerInfo.firstName} ${customerInfo.lastName || ''}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone || 'Not provided'}
Address: ${customerInfo.address || 'Not provided'}
City: ${customerInfo.city || 'Not provided'}
State: ${customerInfo.state || 'Not provided'}
ZIP: ${customerInfo.zipCode || 'Not provided'}

🛒 ORDER ITEMS:
${cartItems.map(item => 
  `• ${item.title}
   Type: ${item.type}
   Size: ${item.size}
   Price: $${item.price.toFixed(2)}
   Quantity: ${item.quantity}
   Subtotal: $${(item.price * item.quantity).toFixed(2)}`
).join('\n\n')}

💰 ORDER TOTAL: $${totalAmount.toFixed(2)}

💳 PAYMENT INFORMATION:
Cardholder: ${paymentInfo.cardholderName}
Last 4 digits: ****${paymentInfo.cardNumber.slice(-4)}
Expires: ${paymentInfo.expirationDate}
Transaction ID: ${paymentInfo.transactionId}

---
Art with Heart & Gifts
Email sent at: ${timestamp}
    `;

    // Try multiple email methods
    let emailSent = false;
    let emailMethod = "";
    let emailError = "";

    // Method 1: Try using a webhook service (like Zapier or Make.com)
    try {
      const webhookData = {
        orderId: orderId,
        customerEmail: customerInfo.email,
        businessEmail: "Artwithheartandgiftsllc@gmail.com",
        subject: `New Order #${orderId} - $${totalAmount.toFixed(2)}`,
        message: emailContent,
        timestamp: timestamp,
        totalAmount: totalAmount
      };

      // Use a webhook URL that can send emails
      const webhookResponse = await fetch("https://hooks.zapier.com/hooks/catch/1234567890/abcdefghijklmnop/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData)
      });

      if (webhookResponse.ok) {
        emailSent = true;
        emailMethod = "Webhook";
      }
    } catch (e) {
      emailError = e.message;
    }

    // Method 2: Try using a simple email API service
    if (!emailSent) {
      try {
        const emailData = {
          to: "Artwithheartandgiftsllc@gmail.com",
          subject: `New Order #${orderId} - $${totalAmount.toFixed(2)}`,
          text: emailContent,
          from: "orders@artwithheartandgifts.com"
        };

        // Try using a simple email service
        const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: "service_123",
            template_id: "template_123",
            user_id: "user_123",
            template_params: emailData
          })
        });

        if (emailResponse.ok) {
          emailSent = true;
          emailMethod = "EmailJS";
        }
      } catch (e) {
        emailError = e.message;
      }
    }

    // Method 3: Try using FormSubmit with proper formatting
    if (!emailSent) {
      try {
        const formData = {
          _subject: `New Order #${orderId} - $${totalAmount.toFixed(2)}`,
          _template: "table",
          _captcha: "false",
          
          order_number: orderId,
          customer_name: `${customerInfo.firstName} ${customerInfo.lastName || ''}`,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone || 'Not provided',
          
          order_items: cartItems.map(item => 
            `${item.title} (${item.type}, ${item.size}) - $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
          ).join('\n'),
          
          total_amount: `$${totalAmount.toFixed(2)}`,
          order_date: new Date().toLocaleString(),
          
          submitted_at: timestamp
        };

        const formResponse = await fetch("https://formsubmit.co/ajax/Artwithheartandgiftsllc@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        if (formResponse.ok) {
          const result = await formResponse.json();
          if (result.success === "true") {
            emailSent = true;
            emailMethod = "FormSubmit Ajax";
          }
        }
      } catch (e) {
        emailError = e.message;
      }
    }

    // Return success response (even if email fails, order is processed)
    const response = {
      success: true,
      orderId: orderId,
      message: "Order processed successfully!",
      emailStatus: emailSent ? "Email sent via " + emailMethod : "Email failed - " + emailError,
      paymentStatus: "pending",
      transactionId: paymentInfo.transactionId,
      timestamp: timestamp
    };

    res.status(200).json(response);

    // Log the order for debugging
    console.log("Order processed:", {
      orderId: orderId,
      customerEmail: customerInfo.email,
      totalAmount: totalAmount,
      emailSent: emailSent,
      emailMethod: emailMethod,
      emailError: emailError
    });

  } catch (error) {
    console.error("Reliable checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

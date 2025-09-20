async function verifyEmailFlow() {
  const BASE_URL =
    "https://artwithheartandgifts-g0bdvxmf8-tnr-business-solutions-projects.vercel.app";

  console.log("📧 Verifying Email Flow...");
  console.log("");

  console.log("🔍 How FormSubmit Works:");
  console.log(
    "1. Business emails → Artwithheartandgiftsllc@gmail.com (your business email)"
  );
  console.log(
    "2. Customer emails → Customer email + FormSubmit confirmation required"
  );
  console.log("");

  // Test checkout to see the full flow
  console.log("🧪 Testing Checkout Email Flow...");
  const testData = {
    customerInfo: {
      firstName: "Email",
      lastName: "Flow Test",
      email: "royturner1498@gmail.com",
      phone: "555-123-4567",
      address: "123 Test St",
      city: "Test City",
      state: "FL",
      zipCode: "12345",
    },
    cartItems: [
      {
        id: "email-flow-test",
        title: "Email Flow Test Item",
        price: 15.0,
        quantity: 1,
        type: "Test",
        size: "Small",
      },
    ],
    totalAmount: 15.0,
    paymentInfo: {
      cardholderName: "Email Flow Test",
      cardNumber: "4111111111111111",
      expirationDate: "12/25",
      cvv: "123",
      transactionId: "EMAIL-FLOW-" + Date.now(),
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/api/enhanced-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Checkout Processed Successfully!");
      console.log("📦 Order Number:", result.data.orderNumber);
      console.log("📧 Email Provider:", result.data.emailDelivery.provider);
      console.log(
        "📬 Email Status:",
        result.data.emailDelivery.success ? "✅ Sent" : "❌ Failed"
      );
      console.log("");

      console.log("📬 Email Delivery Details:");
      console.log("• Business Email: Artwithheartandgiftsllc@gmail.com");
      console.log("  └─ Should receive order notification immediately");
      console.log("• Customer Email: royturner1498@gmail.com");
      console.log("  └─ Should receive FormSubmit confirmation email");
      console.log("  └─ Must click confirmation link to receive order details");
      console.log("");

      console.log("🔍 Check These Locations:");
      console.log(
        "1. Artwithheartandgiftsllc@gmail.com (business notifications)"
      );
      console.log("2. royturner1498@gmail.com (customer confirmations)");
      console.log("3. Spam/Junk folders in both accounts");
      console.log("");

      console.log("⏰ Timeline:");
      console.log("• Business emails: Immediate delivery");
      console.log("• Customer confirmations: 1-5 minutes");
      console.log("• Customer order details: After confirmation click");
    } else {
      console.log("❌ Checkout Failed:", result.error?.message);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

verifyEmailFlow();


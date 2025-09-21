const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDirectEmail() {
  console.log('📧 DIRECT EMAIL DELIVERY TEST\n');
  console.log('🎯 Testing enhanced-checkout endpoint directly for email delivery');
  console.log('📧 Expected: Business and customer emails delivered\n');
  
  const testData = {
    customerInfo: {
      firstName: "EMAIL",
      lastName: "DELIVERY TEST",
      email: "royturner1489@gmail.com",
      phone: "555-123-4567",
      address: "123 Email Test St",
      city: "Test City",
      state: "FL",
      zipCode: "12345",
      specialInstructions: "THIS IS A COMPREHENSIVE EMAIL DELIVERY TEST - Please confirm receipt of both business and customer emails"
    },
    cartItems: [{
      id: "email-delivery-test",
      title: "Email Delivery Test Artwork",
      price: 199.99,
      quantity: 1,
      type: "Canvas",
      size: "20x24"
    }],
    totalAmount: 199.99,
    paymentInfo: {
      cardholderName: "Email Delivery Test",
      cardNumber: "4111111111111111",
      expirationDate: "12/25",
      cvv: "123",
      method: "Credit Card",
      transactionId: "EMAIL-DELIVERY-" + Date.now()
    },
    orderId: "EMAIL-DELIVERY-" + Date.now(),
    referenceNumber: "EMAIL-DELIVERY-TEST"
  };

  try {
    console.log('🔍 Sending comprehensive email delivery test...');
    
    const response = await fetch('http://localhost:3000/api/enhanced-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response Status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ API Success: ${result.success ? 'YES' : 'NO'}`);
      
      if (result.success) {
        console.log(`📧 Order Number: ${result.orderNumber}`);
        console.log(`💳 Transaction ID: ${result.transactionId}`);
        
        if (result.emailDelivery) {
          console.log('\n📧 EMAIL DELIVERY DETAILS:');
          
          if (result.emailDelivery.businessEmail) {
            console.log(`📤 Business Email: ${result.emailDelivery.businessEmail.success ? '✅ SENT' : '❌ FAILED'}`);
            console.log(`   Provider: ${result.emailDelivery.businessEmail.provider}`);
            if (result.emailDelivery.businessEmail.messageId) {
              console.log(`   Message ID: ${result.emailDelivery.businessEmail.messageId}`);
            }
          }
          
          if (result.emailDelivery.customerEmail) {
            console.log(`📤 Customer Email: ${result.emailDelivery.customerEmail.success ? '✅ SENT' : '❌ FAILED'}`);
            console.log(`   Provider: ${result.emailDelivery.customerEmail.provider}`);
            if (result.emailDelivery.customerEmail.messageId) {
              console.log(`   Message ID: ${result.emailDelivery.customerEmail.messageId}`);
            }
          }
        }
        
        console.log('\n🎯 EXPECTED EMAILS:');
        console.log('1. 📧 Business notification → Artwithheartandgiftsllc@gmail.com');
        console.log('2. 📧 Customer confirmation → royturner1489@gmail.com');
        console.log('\n⏰ Check both email inboxes now!');
        console.log('📱 Emails should arrive within 1-2 minutes.');
        
      } else {
        console.log(`❌ API Error: ${result.error}`);
        if (result.details) {
          console.log(`📋 Details: ${result.details}`);
        }
      }
    } else {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`📋 Error Response: ${errorText.substring(0, 200)}...`);
    }

  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
  
  console.log('\n='.repeat(80));
  console.log('📧 EMAIL DELIVERY TEST COMPLETED');
  console.log('='.repeat(80));
  console.log('🔍 Please check your email inboxes:');
  console.log('   📧 royturner1489@gmail.com (customer confirmation)');
  console.log('   📧 Artwithheartandgiftsllc@gmail.com (business notification)');
  console.log('\n⚠️  Test not complete until you receive BOTH emails!');
}

testDirectEmail();

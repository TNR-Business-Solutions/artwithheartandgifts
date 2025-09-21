const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEmailDelivery() {
  console.log('📧 COMPREHENSIVE EMAIL DELIVERY TEST\n');
  console.log('🎯 Goal: Verify both emails are delivered to your inbox');
  console.log('📧 Target: royturner1489@gmail.com (your email)');
  console.log('📧 Business: Artwithheartandgiftsllc@gmail.com\n');
  
  const baseUrl = "http://localhost:3000"; // Test locally first to ensure functionality
  const timestamp = new Date().toISOString();
  
  const tests = [
    {
      name: "📞 Contact Form Email Test",
      endpoint: "/api/contact",
      data: {
        name: "Email Delivery Test - Contact",
        email: "royturner1489@gmail.com", 
        phone: "555-123-4567",
        subject: "Email Delivery Test - Contact Form",
        message: `This is a comprehensive email delivery test for the contact form.
        
Test Details:
- Form: Contact
- Time: ${timestamp}
- Purpose: Verify email delivery to both business and customer
- Expected: Business notification email
        
Please confirm receipt of this email.`
      },
      expectedEmails: ["Business notification to Artwithheartandgiftsllc@gmail.com"]
    },
    {
      name: "🎨 Commission Form Email Test", 
      endpoint: "/api/commission",
      data: {
        name: "Email Delivery Test - Commission",
        email: "royturner1489@gmail.com",
        phone: "555-123-4567",
        projectType: "Custom Painting",
        size: "16x20 inches",
        budget: "$500-$750",
        timeline: "4-6 weeks",
        location: "Home office",
        description: `This is a comprehensive email delivery test for the commission form.
          
Test Details:
- Form: Commission Request
- Time: ${timestamp}
- Purpose: Verify email delivery functionality
- Project: Test commission for email verification

Please confirm receipt of this commission request email.`,
        inspiration: "Email delivery testing with healing art themes"
      },
      expectedEmails: ["Business commission request to Artwithheartandgiftsllc@gmail.com"]
    },
    {
      name: "🛒 Checkout Form Email Test",
      endpoint: "/api/enhanced-checkout", 
      data: {
        customerInfo: {
          firstName: "Email",
          lastName: "Delivery Test",
          email: "royturner1489@gmail.com",
          phone: "555-123-4567",
          address: "123 Email Test St",
          city: "Test City",
          state: "FL",
          zipCode: "12345",
          specialInstructions: "This is an email delivery test order - please confirm receipt"
        },
        cartItems: [{
          id: "email-test-1",
          title: "Email Delivery Test Artwork",
          price: 99.99,
          quantity: 1,
          type: "Canvas",
          size: "16x20"
        }],
        totalAmount: 99.99,
        paymentInfo: {
          cardholderName: "Email Delivery Test",
          cardNumber: "4111111111111111",
          expirationDate: "12/25", 
          cvv: "123",
          method: "Credit Card",
          transactionId: "EMAIL-TEST-" + Date.now()
        },
        orderId: "EMAIL-TEST-" + Date.now(),
        referenceNumber: "EMAIL-DELIVERY-TEST"
      },
      expectedEmails: [
        "Business order notification to Artwithheartandgiftsllc@gmail.com",
        "Customer order confirmation to royturner1489@gmail.com"
      ]
    }
  ];

  console.log('🧪 Running email delivery tests...\n');

  let totalEmailsExpected = 0;
  let successfulAPIs = 0;

  for (const test of tests) {
    try {
      console.log(`${test.name}`);
      console.log(`🔗 POST ${baseUrl}${test.endpoint}`);
      
      totalEmailsExpected += test.expectedEmails.length;

      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.data)
      });

      console.log(`📊 Status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ API Success: ${result.success ? 'YES' : 'NO'}`);
        
        if (result.success) {
          successfulAPIs++;
          
          if (result.data?.emailDelivery || result.emailDelivery) {
            const emailInfo = result.data?.emailDelivery || result.emailDelivery;
            console.log(`📧 Email Provider: ${emailInfo.provider || 'Unknown'}`);
            console.log(`📧 Email Success: ${emailInfo.success ? 'YES' : 'NO'}`);
            if (emailInfo.messageId) {
              console.log(`📧 Message ID: ${emailInfo.messageId}`);
            }
          }
          
          console.log(`📋 Expected Emails:`);
          test.expectedEmails.forEach((email, index) => {
            console.log(`   ${index + 1}. ${email}`);
          });
        } else {
          console.log(`❌ API Error: ${result.error}`);
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
    
    console.log(''); // Add spacing
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📧 EMAIL DELIVERY TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`🔌 Successful API Calls: ${successfulAPIs}/${tests.length}`);
  console.log(`📧 Total Emails Expected: ${totalEmailsExpected}`);
  console.log('');
  console.log('📋 EXPECTED EMAILS IN YOUR INBOX:');
  console.log('1. 📞 Contact form business notification');
  console.log('2. 🎨 Commission request business notification');  
  console.log('3. 🛒 Order business notification');
  console.log('4. 🛒 Order customer confirmation (to royturner1489@gmail.com)');
  console.log('');
  
  if (successfulAPIs === tests.length) {
    console.log('🎉 ALL APIS WORKING! Check your email inbox now.');
    console.log('📧 You should receive emails within 1-2 minutes.');
    console.log('📱 Check both:');
    console.log('   - royturner1489@gmail.com (customer emails)');
    console.log('   - Artwithheartandgiftsllc@gmail.com (business emails)');
  } else {
    console.log('⚠️  Some APIs failed. Check the errors above.');
  }
  
  console.log('='.repeat(80));
  console.log('\n⏰ Please check your email and confirm receipt!');
}

testEmailDelivery();

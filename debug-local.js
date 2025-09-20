// Local debug script for testing checkout API functionality
const nodemailer = require('nodemailer');

// Set up environment variables for local testing
process.env.EMAIL_USER = 'artwithheartandgiftsllc@gmail.com';
process.env.EMAIL_PASS = 'pdbgritvugimnyxh'; // Your current app password
process.env.RECIPIENT_EMAIL = 'artwithheartandgiftsllc@gmail.com';

console.log('🔍 Local Debug Script for Checkout API');
console.log('=====================================');

// Test 1: Environment Variables
console.log('\n1. Testing Environment Variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
console.log('RECIPIENT_EMAIL:', process.env.RECIPIENT_EMAIL ? 'SET' : 'NOT SET');

// Test 2: Nodemailer Configuration
console.log('\n2. Testing Nodemailer Configuration:');
try {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
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
  console.log('✅ Transporter created successfully');
} catch (error) {
  console.error('❌ Transporter creation failed:', error.message);
}

// Test 3: Email Sending Test
console.log('\n3. Testing Email Sending:');
async function testEmailSending() {
  try {
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Test business email
    const businessEmailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: 'Local Debug Test - Business Email',
      html: `
        <h2>Local Debug Test</h2>
        <p>This is a test email sent from the local debug script.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    };

    console.log('Sending business email to:', process.env.RECIPIENT_EMAIL);
    const businessResult = await transporter.sendMail(businessEmailOptions);
    console.log('✅ Business email sent successfully:', businessResult.messageId);

    // Test customer email
    const customerEmailOptions = {
      from: process.env.EMAIL_USER,
      to: 'royturner1489@gmail.com',
      subject: 'Local Debug Test - Customer Email',
      html: `
        <h2>Local Debug Test - Customer Confirmation</h2>
        <p>This is a test customer confirmation email.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    };

    console.log('Sending customer email to: royturner1489@gmail.com');
    const customerResult = await transporter.sendMail(customerEmailOptions);
    console.log('✅ Customer email sent successfully:', customerResult.messageId);

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error details:', error);
  }
}

// Test 4: Checkout Data Validation
console.log('\n4. Testing Checkout Data Validation:');
const testCheckoutData = {
  customerInfo: {
    firstName: 'Test',
    lastName: 'User',
    email: 'royturner1489@gmail.com',
    phone: '555-123-4567',
    address: '123 Test St',
    city: 'Test City',
    state: 'FL',
    zipCode: '12345',
  },
  cartItems: [
    {
      id: 'test-1',
      title: 'Test Artwork',
      price: 10.0,
      quantity: 1,
      type: 'Canvas',
      size: '8x10',
    },
  ],
  totalAmount: 10.0,
  paymentInfo: {
    cardholderName: 'Test User',
    cardNumber: '4111111111111111',
    expirationDate: '12/25',
    cvv: '123',
    method: 'Credit Card',
    transactionId: 'DEBUG-' + Date.now(),
  },
  orderId: 'DEBUG-' + Date.now(),
};

// Validate required fields
console.log('Validating checkout data:');
console.log('customerInfo:', testCheckoutData.customerInfo ? 'PRESENT' : 'MISSING');
console.log('cartItems:', testCheckoutData.cartItems ? 'PRESENT' : 'MISSING');
console.log('totalAmount:', testCheckoutData.totalAmount);
console.log('paymentInfo:', testCheckoutData.paymentInfo ? 'PRESENT' : 'MISSING');

if (!testCheckoutData.customerInfo || !testCheckoutData.cartItems || !testCheckoutData.totalAmount || !testCheckoutData.paymentInfo) {
  console.error('❌ Validation failed - missing required fields');
} else {
  console.log('✅ All required fields present');
}

// Validate customer info structure
if (!testCheckoutData.customerInfo.email || !testCheckoutData.customerInfo.firstName) {
  console.error('❌ Validation failed - missing customer email or firstName');
} else {
  console.log('✅ Customer info structure valid');
}

// Run email test
console.log('\n5. Running Email Tests:');
testEmailSending().then(() => {
  console.log('\n🔍 Local Debug Complete!');
  console.log('Check your email inboxes for test messages.');
  console.log('If emails are received, the issue is likely in the API deployment.');
  console.log('If emails are not received, the issue is with email configuration.');
}).catch(error => {
  console.error('Debug test failed:', error);
});

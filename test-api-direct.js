// Direct API test script
const https = require('https');

console.log('🔍 Testing Checkout API Directly');
console.log('================================');

const testData = {
  customerInfo: {
    firstName: "Test",
    lastName: "User",
    email: "royturner1489@gmail.com",
    phone: "555-123-4567",
    address: "123 Test St",
    city: "Test City",
    state: "FL",
    zipCode: "12345"
  },
  cartItems: [{
    id: "test-1",
    title: "Test Artwork",
    price: 10.00,
    quantity: 1,
    type: "Canvas",
    size: "8x10"
  }],
  totalAmount: 10.00,
  paymentInfo: {
    cardholderName: "Test User",
    cardNumber: "4111111111111111",
    expirationDate: "12/25",
    cvv: "123",
    method: "Credit Card",
    transactionId: "TEST-" + Date.now()
  },
  orderId: "TEST-" + Date.now()
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'artwithheartandgifts-bz7l9nu3w-tnr-business-solutions-projects.vercel.app',
  port: 443,
  path: '/api/secure-checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending test data:', JSON.stringify(testData, null, 2));

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
    
    if (res.statusCode === 200) {
      console.log('\n✅ API call successful!');
    } else {
      console.log('\n❌ API call failed with status:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(postData);
req.end();

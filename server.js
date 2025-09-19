const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.static("."));

// Import API routes
const secureCheckout = require("./api/secure-checkout.js");
const testGmail = require("./api/test-gmail.js");
const contact = require("./api/contact.js");
const commission = require("./api/commission.js");
const orders = require("./api/orders.js");
const paymentComplete = require("./api/payment/complete.js");

// API Routes
app.post("/api/secure-checkout", secureCheckout);
app.post("/api/test-gmail", testGmail);
app.post("/api/contact", contact);
app.post("/api/commission", commission);
app.post("/api/orders", orders);
app.post("/api/payment/complete", paymentComplete);

// Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API endpoints available at /api/*");
});

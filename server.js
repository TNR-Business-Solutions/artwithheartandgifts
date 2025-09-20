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
const enhancedCheckout = require("./api/enhanced-checkout.js");
const reliableCheckout = require("./api/reliable-checkout.js");
const enhancedContact = require("./api/enhanced-contact.js");
const enhancedCommission = require("./api/enhanced-commission.js");
const health = require("./api/health.js");

// API Routes
app.post("/api/secure-checkout", secureCheckout);
app.post("/api/test-gmail", testGmail);
app.post("/api/enhanced-checkout", enhancedCheckout);
app.post("/api/reliable-checkout", reliableCheckout);
app.post("/api/contact", enhancedContact);
app.post("/api/commission", enhancedCommission);
app.get("/api/health", health);

// Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API endpoints available at /api/*");
});

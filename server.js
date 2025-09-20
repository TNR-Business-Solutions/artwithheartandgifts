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

// Import API routes (minimal set for Vercel Hobby limit)
const secureCheckout = require("./api/secure-checkout.js");
const enhancedCheckout = require("./api/enhanced-checkout.js");

// API Routes (only essential ones)
app.post("/api/secure-checkout", secureCheckout);
app.post("/api/enhanced-checkout", enhancedCheckout);
app.post("/api/contact", enhancedCheckout); // Reuse enhanced-checkout for contact
app.post("/api/commission", enhancedCheckout); // Reuse enhanced-checkout for commission

// Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API endpoints available at /api/*");
});

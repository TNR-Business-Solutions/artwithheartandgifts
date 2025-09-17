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

// API Routes
app.post("/api/secure-checkout", secureCheckout);

// Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API endpoints available at /api/*");
});

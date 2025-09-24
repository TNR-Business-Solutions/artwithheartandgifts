const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testAPI() {
  try {
    const response = await fetch(
      "https://www.artwithheartandgifts.com/api/enhanced-checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "contact",
          name: "Test User",
          email: "test@example.com",
          message: "Test email delivery",
        }),
      }
    );

    const result = await response.json();
    console.log("API Response:", JSON.stringify(result, null, 2));
    console.log("Status:", response.status);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAPI();

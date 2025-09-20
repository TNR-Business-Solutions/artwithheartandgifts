// Checkout page functionality fix
// Handles the secure checkout form submission

document.addEventListener("DOMContentLoaded", function () {
  console.log("Checkout page loaded");

  // Load cart data if available
  if (window.cart) {
    updateCheckoutTotals();
  }

  // Handle checkout form submission
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }
});

function updateCheckoutTotals() {
  if (!window.cart) return;

  const subtotal = window.cart.getSubtotal();
  const tax = window.cart.getTax();
  const shipping = window.cart.getShipping();
  const total = window.cart.getTotal();

  // Update display elements
  const elements = {
    "subtotal-amount": subtotal,
    "tax-amount": tax,
    "shipping-amount": shipping,
    "final-total": total,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value.toFixed(2);
    }
  });
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();

  const submitBtn =
    document.getElementById("checkoutSubmitBtn") ||
    event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  try {
    // Show loading state
    submitBtn.textContent = "Processing...";
    submitBtn.disabled = true;

    // Get form data
    const formData = new FormData(event.target);
    const customer = {
      name: formData.get("customerName"),
      email: formData.get("customerEmail"),
      phone: formData.get("customerPhone"),
      address: formData.get("shippingAddress"),
      city: formData.get("city"),
      state: formData.get("state"),
      zipCode: formData.get("zipCode"),
    };

    const payment = {
      cardholderName: formData.get("cardholderName"),
      cardNumber: formData.get("cardNumber"),
      expirationDate:
        formData.get("expirationMonth") + "/" + formData.get("expirationYear"),
      cvv: formData.get("cvv"),
      saveCard: formData.get("saveCard") === "on",
    };

    // Get cart items
    const cart = window.cart;
    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty");
    }

    console.log("Cart items:", cart.items);
    console.log("Cart total:", cart.getTotal());

    const order = {
      items: cart.items,
      totals: {
        subtotal: cart.getSubtotal(),
        tax: cart.getTax(),
        shipping: cart.getShipping(),
        total: cart.getTotal(),
      },
      specialInstructions: formData.get("specialInstructions"),
      referenceNumber: formData.get("referenceNumber"),
    };

    // Submit to secure checkout endpoint
    const response = await fetch("/api/secure-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerInfo: {
          firstName: customer.name.split(" ")[0] || customer.name,
          lastName: customer.name.split(" ").slice(1).join(" ") || "",
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          specialInstructions: formData.get("specialInstructions"),
        },
        cartItems: cart.items,
        totalAmount: cart.getTotal(),
        paymentInfo: {
          cardholderName: payment.cardholderName,
          cardNumber: payment.cardNumber,
          expirationDate: payment.expirationDate,
          cvv: payment.cvv,
          saveCard: payment.saveCard,
          method: "Credit Card",
        },
        orderId: null, // Let the API generate one
        referenceNumber: formData.get("referenceNumber") || null,
      }),
    });

    const result = await response.json();
    console.log("Checkout response:", result);

    if (result.success) {
      // Clear cart
      cart.clear();

      // Show success message
      showSuccessMessage(result.orderId);
    } else {
      throw new Error(result.error || "Checkout failed");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    showErrorMessage(error.message);
  } finally {
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function showSuccessMessage(orderId) {
  const successHtml = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
        <h2 style="color: #2c5530;">✅ Order Submitted Successfully!</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p>Your secure checkout has been submitted. You will receive a confirmation email shortly.</p>
        <p>We will process your payment and ship your order within 3-5 business days.</p>
        <div style="margin-top: 20px;">
          <button onclick="window.location.href='/'" style="background: #2c5530; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer;">
            Return to Home
          </button>
          <button onclick="window.location.href='/shop.html'" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer;">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", successHtml);
}

function showErrorMessage(message) {
  const errorHtml = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
        <h2 style="color: #e74c3c;">❌ Checkout Error</h2>
        <p>${message}</p>
        <p>Please try again or contact us directly at artwithheartandgifts@yahoo.com</p>
        <button onclick="this.parentElement.parentElement.remove()" style="background: #2c5530; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          Try Again
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", errorHtml);
}

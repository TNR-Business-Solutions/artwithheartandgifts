// Swipe Simple Checkout Integration
// Handles the complete checkout flow with Swipe Simple payment links

class SwipeSimpleCheckout {
  constructor() {
    this.apiUrl = "/api/orders";
    this.isProcessing = false;
  }

  // Handle complete checkout process
  async processCheckout(cartItems, customerInfo) {
    if (this.isProcessing) {
      console.log("Checkout already in progress...");
      return;
    }

    this.isProcessing = true;

    try {
      // Show loading state
      this.showLoadingState();

      // Prepare order data
      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone || "",
          address: customerInfo.address || "",
          city: customerInfo.city || "",
          state: customerInfo.state || "",
          zip: customerInfo.zip || "",
        },
        shippingMethod: "standard",
      };

      // Create order and get payment link
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Hide loading state
        this.hideLoadingState();

        if (result.paymentUrl) {
          // Redirect to Swipe Simple payment page
          this.redirectToPayment(result.paymentUrl, result.orderId);
        } else if (result.manualInstructions) {
          // Show manual payment instructions
          this.showManualPaymentInstructions(result);
        } else {
          // Fallback error handling
          this.showError(
            "Payment link could not be created. Please try again."
          );
        }
      } else {
        this.showError(result.error || "Checkout failed. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      this.showError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      this.isProcessing = false;
    }
  }

  // Redirect to Swipe Simple payment page
  redirectToPayment(paymentUrl, orderId) {
    // Store order ID for return
    sessionStorage.setItem("currentOrderId", orderId);

    // Show redirect message
    this.showRedirectMessage(paymentUrl);

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = paymentUrl;
    }, 2000);
  }

  // Show redirect message
  showRedirectMessage(paymentUrl) {
    const messageHtml = `
      <div class="checkout-redirect-message">
        <div class="redirect-content">
          <h3>Redirecting to Secure Payment...</h3>
          <p>You will be redirected to Swipe Simple's secure payment page.</p>
          <p>If you are not redirected automatically, <a href="${paymentUrl}" target="_blank">click here</a>.</p>
          <div class="spinner"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", messageHtml);
  }

  // Show manual payment instructions
  showManualPaymentInstructions(result) {
    const instructionsHtml = `
      <div class="manual-payment-modal">
        <div class="modal-content">
          <h3>Payment Instructions</h3>
          <p>Order #${
            result.orderId
          } has been created. Please follow these steps to complete payment:</p>
          <ol>
            ${result.manualInstructions.instructions
              .map((instruction) => `<li>${instruction}</li>`)
              .join("")}
          </ol>
          <div class="order-details">
            <h4>Order Details:</h4>
            <p><strong>Total:</strong> $${result.totals.total.toFixed(2)}</p>
            <p><strong>Customer:</strong> ${
              result.manualInstructions.orderDetails.customer.name
            }</p>
            <p><strong>Email:</strong> ${
              result.manualInstructions.orderDetails.customer.email
            }</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="btn primary">Close</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", instructionsHtml);
  }

  // Show loading state
  showLoadingState() {
    const loadingHtml = `
      <div class="checkout-loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Processing your order...</p>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", loadingHtml);
  }

  // Hide loading state
  hideLoadingState() {
    const loading = document.querySelector(".checkout-loading");
    if (loading) {
      loading.remove();
    }
  }

  // Show error message
  showError(message) {
    this.hideLoadingState();

    const errorHtml = `
      <div class="checkout-error">
        <div class="error-content">
          <h3>Checkout Error</h3>
          <p>${message}</p>
          <button onclick="this.parentElement.parentElement.remove()" class="btn primary">Close</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", errorHtml);
  }

  // Handle payment return (success page)
  handlePaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId =
      urlParams.get("order_id") || sessionStorage.getItem("currentOrderId");

    if (orderId) {
      // Clear stored order ID
      sessionStorage.removeItem("currentOrderId");

      // Show success message
      this.showPaymentSuccess(orderId);
    }
  }

  // Show payment success message
  showPaymentSuccess(orderId) {
    const successHtml = `
      <div class="payment-success">
        <div class="success-content">
          <h3>Payment Successful!</h3>
          <p>Thank you for your purchase. Your order #${orderId} has been confirmed.</p>
          <p>You will receive an email confirmation shortly.</p>
          <a href="/shop.html" class="btn primary">Continue Shopping</a>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", successHtml);
  }
}

// Initialize global checkout instance
window.swipeSimpleCheckout = new SwipeSimpleCheckout();

// Handle payment return on success page
if (window.location.pathname.includes("order-success")) {
  window.swipeSimpleCheckout.handlePaymentReturn();
}

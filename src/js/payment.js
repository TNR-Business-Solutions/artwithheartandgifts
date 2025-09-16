// Payment integration for Art with Heart & Gifts
// This handles Swipe Simple payment processing

class PaymentProcessor {
  constructor() {
    this.isInitialized = false;
    this.swipeSimpleConfig = {
      // These will be configured when you set up your Swipe Simple account
      merchantId: "YOUR_MERCHANT_ID", // Replace with actual merchant ID
      apiKey: "YOUR_API_KEY", // Replace with actual API key
      baseUrl: "https://api.swipesimple.com",
    };
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    console.log("Swipe Simple payment processor initialized");
  }

  // Create a Swipe Simple payment link
  async createPaymentLink(amount, productInfo) {
    try {
      // For now, we'll use the Swipe Simple Payment Links feature
      // You can create these through the Swipe Simple dashboard
      const paymentData = {
        amount: amount,
        description: productInfo.title,
        productId: productInfo.id,
        merchantId: this.swipeSimpleConfig.merchantId,
      };

      // Store payment data for later reference
      sessionStorage.setItem("pendingPayment", JSON.stringify(paymentData));

      return paymentData;
    } catch (error) {
      console.error("Error creating payment link:", error);
      throw error;
    }
  }

  async setupPaymentForm(containerId, amount, productInfo) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    try {
      const paymentData = await this.createPaymentLink(amount, productInfo);

      // Create Swipe Simple payment form
      container.innerHTML = `
        <div class="payment-form">
          <h3>Complete Your Purchase</h3>
          <div class="product-summary">
            <h4>${productInfo.title}</h4>
            <p class="price">$${amount.toFixed(2)}</p>
          </div>
          <div class="swipe-simple-payment">
            <p>You'll be redirected to Swipe Simple to complete your secure payment.</p>
            <div class="payment-options">
              <button id="swipe-simple-pay" class="btn primary">
                Pay $${amount.toFixed(2)} with Swipe Simple
              </button>
              <p class="payment-note">
                <small>Secure payment processing by Swipe Simple</small>
              </p>
            </div>
          </div>
          <div id="payment-message" class="payment-message"></div>
        </div>
      `;

      // Handle Swipe Simple payment
      const payButton = document.getElementById("swipe-simple-pay");
      payButton.addEventListener("click", () =>
        this.handleSwipeSimplePayment(amount, productInfo)
      );
    } catch (error) {
      console.error("Error setting up payment form:", error);
      container.innerHTML = this.showAlternativePayment(productInfo);
    }
  }

  async handleSwipeSimplePayment(amount, productInfo) {
    const payButton = document.getElementById("swipe-simple-pay");
    const messageDiv = document.getElementById("payment-message");

    payButton.disabled = true;
    payButton.textContent = "Redirecting to Swipe Simple...";

    try {
      // Create a payment link using Swipe Simple's Payment Links feature
      // For now, we'll redirect to a contact form with payment details
      // Once you set up Swipe Simple Payment Links, you can replace this with actual links

      const paymentDetails = {
        product: productInfo.title,
        amount: amount,
        description: `Purchase: ${productInfo.title} - $${amount.toFixed(2)}`,
      };

      // Store payment details for the contact form
      sessionStorage.setItem("paymentInquiry", JSON.stringify(paymentDetails));

      // Redirect to contact form with pre-filled payment inquiry
      window.location.href = `/contact.html?subject=Payment Inquiry: ${encodeURIComponent(
        productInfo.title
      )}&amount=${amount}`;
    } catch (error) {
      console.error("Swipe Simple payment error:", error);
      messageDiv.innerHTML =
        '<p class="error">Unable to process payment. Please contact us directly.</p>';
      payButton.disabled = false;
      payButton.textContent = "Try Again";
    }
  }

  // Alternative payment methods
  showAlternativePayment(productInfo) {
    return `
      <div class="alternative-payment">
        <h3>Purchase: ${productInfo.title}</h3>
        <p class="price">$${productInfo.price}</p>
        <div class="payment-options">
          <div class="payment-option">
            <h4>PayPal</h4>
            <p>Pay securely with PayPal</p>
            <button class="btn secondary" onclick="window.open('https://paypal.me/artwithheartandgifts', '_blank')">
              Pay with PayPal
            </button>
          </div>
          <div class="payment-option">
            <h4>Venmo</h4>
            <p>Send payment via Venmo</p>
            <button class="btn secondary" onclick="window.open('https://venmo.com/artwithheartandgifts', '_blank')">
              Pay with Venmo
            </button>
          </div>
          <div class="payment-option">
            <h4>Contact for Payment</h4>
            <p>We'll send you payment instructions</p>
            <a href="/contact.html?subject=Purchase: ${encodeURIComponent(
              productInfo.title
            )}" class="btn primary">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

// Export for use in other modules
window.PaymentProcessor = PaymentProcessor;

// Initialize payment processor when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.paymentProcessor = new PaymentProcessor();
  window.paymentProcessor.initialize();
});

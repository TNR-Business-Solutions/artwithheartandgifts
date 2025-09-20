// Shopping Cart functionality for Art with Heart & Gifts
class ShoppingCart {
  constructor() {
    this.items = [];
    this.loadFromStorage();
  }

  // Load cart from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem("artwithheartandgifts_cart");
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error);
      this.items = [];
    }
  }

  // Save cart to localStorage
  saveToStorage() {
    try {
      localStorage.setItem(
        "artwithheartandgifts_cart",
        JSON.stringify(this.items)
      );
    } catch (error) {
      console.error("Error saving cart to storage:", error);
    }
  }

  // Add item to cart
  addItem(product) {
    const existingItem = this.items.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        image: product.image,
        price: product.price,
        size: product.size,
        type: product.type,
        quantity: 1,
      });
    }

    this.saveToStorage();
    this.updateCartUI();
    this.showCartNotification();
  }

  // Remove item from cart
  removeItem(productId) {
    this.items = this.items.filter((item) => item.id !== productId);
    this.saveToStorage();
    this.updateCartUI();
  }

  // Update item quantity
  updateQuantity(productId, quantity) {
    const item = this.items.find((item) => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.saveToStorage();
        this.updateCartUI();
      }
    }
  }

  // Get cart total
  // Get subtotal (before tax and shipping)
  getSubtotal() {
    return this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  // Get Florida sales tax (6%)
  getTax() {
    return this.getSubtotal() * 0.06;
  }

  // Get shipping cost
  getShipping() {
    const subtotal = this.getSubtotal();
    if (subtotal >= 100) {
      return 0; // Free shipping over $100
    } else if (subtotal >= 50) {
      return 8.99; // Standard shipping
    } else {
      return 12.99; // Express shipping for smaller orders
    }
  }

  // Get total price (subtotal + tax + shipping)
  getTotal() {
    return this.getSubtotal() + this.getTax() + this.getShipping();
  }

  // Get cart count
  getCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  // Clear cart
  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateCartUI();
  }

  // Show cart notification
  showCartNotification() {
    const notification = document.createElement("div");
    notification.className = "cart-notification";
    notification.innerHTML = `
      <div class="cart-notification-content">
        <span>✓ Added to cart!</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  // Update cart UI
  updateCartUI() {
    const cartCount = document.getElementById("cart-count");
    const cartSubtotal = document.getElementById("cart-subtotal");
    const cartShipping = document.getElementById("cart-shipping");
    const cartTax = document.getElementById("cart-tax");
    const cartTotal = document.getElementById("cart-total");
    const cartItems = document.getElementById("cart-items");

    if (cartCount) {
      cartCount.textContent = this.getCount();
      cartCount.style.display = this.getCount() > 0 ? "block" : "none";
    }

    if (cartSubtotal) {
      cartSubtotal.textContent = `$${this.getSubtotal().toFixed(2)}`;
    }

    if (cartShipping) {
      const shipping = this.getShipping();
      cartShipping.textContent =
        shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
    }

    if (cartTax) {
      cartTax.textContent = `$${this.getTax().toFixed(2)}`;
    }

    if (cartTotal) {
      cartTotal.textContent = `$${this.getTotal().toFixed(2)}`;
    }

    if (cartItems) {
      this.renderCartItems(cartItems);
    }
  }

  // Render cart items
  renderCartItems(container) {
    if (this.items.length === 0) {
      container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      return;
    }

    container.innerHTML = this.items
      .map(
        (item) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.title}</h4>
          <p class="cart-item-meta">${item.size} • ${item.type}</p>
          <div class="cart-item-controls">
            <button onclick="window.cart.updateQuantity('${item.id}', ${
          item.quantity - 1
        })">-</button>
            <span>${item.quantity}</span>
            <button onclick="window.cart.updateQuantity('${item.id}', ${
          item.quantity + 1
        })">+</button>
            <button onclick="window.cart.removeItem('${
              item.id
            }')" class="remove-btn">Remove</button>
          </div>
        </div>
        <div class="cart-item-price">$${(item.price * item.quantity).toFixed(
          2
        )}</div>
      </div>
    `
      )
      .join("");
  }

  // Checkout - redirect to checkout page
  checkout() {
    if (this.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Redirect to secure checkout form
    window.location.href = `${window.location.origin}/checkout.html`;
  }

  // Get customer information (in production, this would come from a form)
  getCustomerInfo() {
    return {
      name: "Test Customer",
      email: "test@example.com",
      phone: "",
      address: {
        street: "123 Test St",
        city: "Zephyrhills",
        state: "FL",
        zip: "33540",
        country: "US",
      },
    };
  }

  // Show test payment page
  showTestPayment(orderResult) {
    const testPaymentHtml = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
          <h2>Test Payment</h2>
          <p><strong>Order ID:</strong> ${orderResult.orderId}</p>
          <p><strong>Total:</strong> $${orderResult.totals.total.toFixed(2)}</p>
          <p><strong>Subtotal:</strong> $${orderResult.totals.subtotal.toFixed(
            2
          )}</p>
          <p><strong>Shipping:</strong> $${orderResult.totals.shipping.toFixed(
            2
          )}</p>
          <p><strong>Tax:</strong> $${orderResult.totals.tax.toFixed(2)}</p>
          <div style="margin: 20px 0;">
            <button onclick="window.cart.completeTestPayment('${
              orderResult.orderId
            }', 'completed')" 
                    style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer;">
              Simulate Successful Payment
            </button>
            <button onclick="window.cart.completeTestPayment('${
              orderResult.orderId
            }', 'failed')" 
                    style="background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer;">
              Simulate Failed Payment
            </button>
          </div>
          <button onclick="document.body.removeChild(this.parentElement.parentElement)" 
                  style="background: #ccc; color: black; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer;">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", testPaymentHtml);
  }

  // Complete test payment
  async completeTestPayment(orderId, status) {
    try {
      const response = await fetch("/api/payment/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentStatus: status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart and show success message
        this.clear();
        alert(
          `Payment ${
            status === "completed" ? "successful" : "failed"
          }! Order ID: ${orderId}`
        );

        // Remove test payment modal
        const modal = document.querySelector('div[style*="position: fixed"]');
        if (modal) {
          modal.remove();
        }

        // Close cart modal
        const cartModal = document.getElementById("cart-modal");
        if (cartModal) {
          cartModal.style.display = "none";
        }
      } else {
        throw new Error(result.error || "Payment completion failed");
      }
    } catch (error) {
      console.error("Payment completion error:", error);
      alert(`Payment completion failed: ${error.message}`);
    }
  }

  // Show checkout form
  showCheckoutForm() {
    const modal = document.createElement("div");
    modal.className = "checkout-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
        <div style="padding: 1.5rem; border-bottom: 2px solid #2c5530; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; color: #2c5530;">Checkout</h2>
          <button onclick="this.closest('.checkout-modal').remove()" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <form id="checkoutForm">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Name *</label>
              <input type="text" id="checkoutName" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email Address *</label>
              <input type="email" id="checkoutEmail" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Phone Number</label>
              <input type="tel" id="checkoutPhone" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Shipping Address</label>
              <textarea id="checkoutAddress" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; resize: vertical;"></textarea>
            </div>
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
              <h4 style="margin: 0 0 0.5rem 0; color: #2c5530;">Order Summary</h4>
              <div id="checkoutItems"></div>
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #ddd;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.9rem;">
                  <span>Subtotal:</span>
                  <span id="checkout-subtotal">$${this.getSubtotal().toFixed(
                    2
                  )}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.9rem;">
                  <span>Shipping:</span>
                  <span id="checkout-shipping">${
                    this.getShipping() === 0
                      ? "FREE"
                      : "$" + this.getShipping().toFixed(2)
                  }</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.9rem;">
                  <span>Tax (FL 6%):</span>
                  <span id="checkout-tax">$${this.getTax().toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #ddd; font-weight: 600; font-size: 1.1rem;">
                  <span>Total:</span>
                  <span id="checkout-total">$${this.getTotal().toFixed(
                    2
                  )}</span>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 1rem;">
              <button type="button" onclick="this.closest('.checkout-modal').remove()" style="flex: 1; padding: 0.75rem; background: #6b7280; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer;">Cancel</button>
              <button type="submit" style="flex: 1; padding: 0.75rem; background: #2c5530; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer;">Complete Order</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Populate order summary
    const checkoutItems = document.getElementById("checkoutItems");
    checkoutItems.innerHTML = this.items
      .map(
        (item) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
        <span>${item.title} x${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `
      )
      .join("");

    // Handle form submission
    document
      .getElementById("checkoutForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.processOrder(modal);
      });
  }

  // Process order (Netlify-compatible, client-side only)
  async processOrder(modal) {
    try {
      const customer = {
        name: document.getElementById("checkoutName").value,
        email: document.getElementById("checkoutEmail").value,
        phone: document.getElementById("checkoutPhone").value,
        address: document.getElementById("checkoutAddress").value,
      };

      // Generate order ID client-side
      const orderId =
        "ORD-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substr(2, 9).toUpperCase();

      // Create order data
      const orderData = {
        id: orderId,
        items: this.items,
        customer,
        subtotal: this.getSubtotal(),
        shipping: this.getShipping(),
        tax: this.getTax(),
        total: this.getTotal(),
        paymentMethod: "swipe-simple",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Store order in localStorage for reference
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      existingOrders.push(orderData);
      localStorage.setItem("orders", JSON.stringify(existingOrders));

      // Clear cart
      this.clear();

      // Close modal
      modal.remove();

      // Redirect to payment portal
      this.redirectToPaymentPortal(orderData);
    } catch (error) {
      console.error("Error processing order:", error);
      alert("There was an error processing your order. Please try again.");
    }
  }

  // Redirect to payment portal
  redirectToPaymentPortal(orderData) {
    // Create payment portal URL with order details
    const paymentUrl = this.createPaymentPortalUrl(orderData);

    // Show payment portal in new window
    const paymentWindow = window.open(
      paymentUrl,
      "payment",
      "width=800,height=600,scrollbars=yes,resizable=yes"
    );

    // Focus on payment window
    if (paymentWindow) {
      paymentWindow.focus();
    } else {
      // Fallback if popup blocked
      window.location.href = paymentUrl;
    }
  }

  // Create payment portal URL
  createPaymentPortalUrl(orderData) {
    const baseUrl = "https://checkout.stripe.com/pay/";

    // Create order summary for payment
    const orderSummary = {
      orderId: orderData.id,
      items: orderData.items.map((item) => ({
        name: item.title,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      tax: orderData.tax,
      total: orderData.total,
      customer: orderData.customer,
    };

    // For now, redirect to contact page with payment details
    // In production, this would integrate with Stripe or Swipe Simple
    const itemList = orderData.items
      .map(
        (item) =>
          `${item.title} (${item.size}) - Qty: ${item.quantity} - $${(
            item.price * item.quantity
          ).toFixed(2)}`
      )
      .join("\n");

    const subject = `Payment Required - Order #${
      orderData.id
    } - $${orderData.total.toFixed(2)}`;
    const message = `PAYMENT PORTAL - Order #${orderData.id}

ORDER SUMMARY:
${itemList}

PRICING BREAKDOWN:
Subtotal: $${orderData.subtotal.toFixed(2)}
Shipping: ${
      orderData.shipping === 0 ? "FREE" : "$" + orderData.shipping.toFixed(2)
    }
Tax (FL 6%): $${orderData.tax.toFixed(2)}
TOTAL: $${orderData.total.toFixed(2)}

CUSTOMER INFORMATION:
Name: ${orderData.customer.name}
Email: ${orderData.customer.email}
Phone: ${orderData.customer.phone || "Not provided"}
Address: ${orderData.customer.address || "Not provided"}

PAYMENT INSTRUCTIONS:
1. I will send you a Swipe Simple payment link via email
2. Click the link to complete your payment securely
3. Your prints will be processed and shipped within 3-5 business days
4. You will receive tracking information via email

Thank you for your order!`;

    return `/contact.html?subject=${encodeURIComponent(
      subject
    )}&message=${encodeURIComponent(message)}`;
  }

  // Show payment instructions for manual payment link creation
  showPaymentInstructions(result) {
    const { orderDetails, instructions } = result;

    // Create a modal or redirect to a payment instructions page
    const instructionsHtml = `
      <div style="max-width: 600px; margin: 50px auto; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #2c5530; text-align: center; margin-bottom: 30px;">Order Confirmation</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c5530; margin-top: 0;">Order Details</h3>
          <p><strong>Order ID:</strong> ${orderDetails.id}</p>
          <p><strong>Total Amount:</strong> $${orderDetails.total.toFixed(
            2
          )}</p>
          <p><strong>Customer:</strong> ${orderDetails.customer.name}</p>
          <p><strong>Email:</strong> ${orderDetails.customer.email}</p>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c5530; margin-top: 0;">Payment Instructions</h3>
          <p>Your order has been received! To complete your payment:</p>
          <ol>
            <li>I will create a secure payment link in Swipe Simple</li>
            <li>You will receive an email with the payment link</li>
            <li>Click the link to complete your payment securely</li>
            <li>Your artwork will be processed and shipped within 3-5 business days</li>
          </ol>
        </div>

        <div style="text-align: center;">
          <p style="color: #666;">You can also contact me directly at:</p>
          <p><strong>Email:</strong> artwithheartandgifts@yahoo.com</p>
          <p><strong>Phone:</strong> (239) 878-9849</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.location.href='/'" style="background: #2c5530; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            Return to Home
          </button>
        </div>
      </div>
    `;

    // Create a new page or overlay with instructions
    document.body.innerHTML = instructionsHtml;
  }
}

// Initialize cart
window.cart = new ShoppingCart();

// Update cart UI on page load
document.addEventListener("DOMContentLoaded", () => {
  window.cart.updateCartUI();
});

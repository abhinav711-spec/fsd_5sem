const CART_KEY = "shoppingCart";

const getCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("Unable to read cart data", error);
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const renderCart = () => {
  const cart = getCart();
  const cartItems = document.getElementById("cart-items");
  const totalElm = document.getElementById("cart-total");

  if (!cartItems || !totalElm) return;

  if (cart.length === 0) {
    cartItems.innerHTML = "<p class='empty-cart'>Your cart is empty.</p>";
    totalElm.textContent = "$0.00";
    return;
  }

  let totalPrice = 0;

  cartItems.innerHTML = cart
    .map((item, index) => {
      const itemTotal = item.price * item.quantity;
      totalPrice += itemTotal;

      return `
        <div class="cart-item">
          <img src="${item.thumbnail || "https://via.placeholder.com/80"}" alt="${item.title}" class="cart-item-image" />
          <div class="cart-item-details">
            <h3>${item.title}</h3>
            <p>Price: $${item.price}</p>
            <div class="cart-item-controls">
              <button type="button" class="qty-btn" data-action="decrement" data-index="${index}">-</button>
              <span>${item.quantity}</span>
              <button type="button" class="qty-btn" data-action="increment" data-index="${index}">+</button>
            </div>
          </div>
          <div class="cart-item-actions">
            <p class="item-total">$${itemTotal.toFixed(2)}</p>
            <button type="button" class="remove-btn" data-index="${index}">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");

  totalElm.textContent = `$${totalPrice.toFixed(2)}`;

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const nextCart = getCart();
      nextCart.splice(index, 1);
      saveCart(nextCart);
      renderCart();
    });
  });

  document.querySelectorAll(".qty-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const action = button.dataset.action;
      const nextCart = getCart();

      if (action === "increment") {
        nextCart[index].quantity += 1;
      } else if (action === "decrement") {
        nextCart[index].quantity = Math.max(nextCart[index].quantity - 1, 1);
      }

      saveCart(nextCart);
      renderCart();
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  renderCart();

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = getCart();

      if (cart.length === 0) {
        alert("Your cart is empty. Add some products first.");
        return;
      }

      alert("Order placed successfully!");
      saveCart([]);
      renderCart();
    });
  }
});

window.renderCart = renderCart;

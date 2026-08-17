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

const updateCartBadge = () => {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const totalItems = getCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
  badge.textContent = totalItems;
};

const addMultipleOrders = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) return;

  const cart = getCart();

  orders.forEach((newOrder) => {
    if (!newOrder || !newOrder.id || !newOrder.title) return;

    const quantity = Number(newOrder.quantity || 1);
    const existingItemIndex = cart.findIndex((item) => item.id === newOrder.id);

    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        id: newOrder.id,
        title: newOrder.title,
        price: Number(newOrder.price || 0),
        thumbnail: newOrder.thumbnail || "",
        quantity,
      });
    }
  });

  saveCart(cart);
  updateCartBadge();
};

const addSingleOrder = (product, quantity = 1) => {
  if (!product) return;

  addMultipleOrders([
    {
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity,
    },
  ]);
};

window.getCart = getCart;
window.saveCart = saveCart;
window.addSingleOrder = addSingleOrder;
window.addMultipleOrders = addMultipleOrders;

const getProductsData = async () => {
  const productContainer = document.getElementById("products-container");
  if (!productContainer) return;

  try {
    const response = await fetch("https://dummyjson.com/products");
    const data = await response.json();
    const products = data.products || [];

    products.slice(0, 20).forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const img = document.createElement("img");
      img.src = product.thumbnail;
      img.alt = product.title;
      img.className = "product-image";

      const title = document.createElement("h3");
      title.textContent = product.title;

      const price = document.createElement("p");
      price.className = "product-price";
      price.textContent = `$${product.price}`;

      const controls = document.createElement("div");
      controls.className = "qty-controls";

      const decrementBtn = document.createElement("button");
      decrementBtn.textContent = "-";
      decrementBtn.type = "button";

      const quantityDisplay = document.createElement("span");
      quantityDisplay.textContent = "1";
      quantityDisplay.className = "quantity-value";

      const incrementBtn = document.createElement("button");
      incrementBtn.textContent = "+";
      incrementBtn.type = "button";

      let itemCount = 1;

      decrementBtn.addEventListener("click", () => {
        if (itemCount > 1) {
          itemCount -= 1;
          quantityDisplay.textContent = itemCount;
        }
      });

      incrementBtn.addEventListener("click", () => {
        itemCount += 1;
        quantityDisplay.textContent = itemCount;
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "Add to cart";
      addBtn.type = "button";
      addBtn.className = "add-btn";

      addBtn.addEventListener("click", () => {
        addSingleOrder(product, itemCount);
        addBtn.textContent = "Added";
        setTimeout(() => {
          addBtn.textContent = "Add to cart";
        }, 700);
      });

      controls.appendChild(decrementBtn);
      controls.appendChild(quantityDisplay);
      controls.appendChild(incrementBtn);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(price);
      card.appendChild(controls);
      card.appendChild(addBtn);
      productContainer.appendChild(card);
    });
  } catch (error) {
    productContainer.innerHTML = "<p>Unable to load products. Please try again later.</p>";
    console.error("Error loading products:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  getProductsData();
});

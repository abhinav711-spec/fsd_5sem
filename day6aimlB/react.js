const { useEffect, useState } = React;
const CART_KEY = "shoppingCart";

function readCart() {
	try {
		const savedCart = JSON.parse(localStorage.getItem(CART_KEY));
		return Array.isArray(savedCart) ? savedCart : [];
	} catch (error) {
		return [];
	}
}

function ProductCard({ product, onAdd }) {
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);

	const addToCart = () => {
		onAdd(product, quantity);
		setAdded(true);
		setTimeout(() => setAdded(false), 700);
	};

	return (
		<div className="product-card">
			<img className="product-image" src={product.thumbnail} alt={product.title} />
			<div className="product-card-content">
				<p className="product-category">{product.category}</p>
				<h2>{product.title}</h2>
				<p className="product-description">{product.description}</p>
				<p className="product-price">${product.price}</p>
				<div className="quantity-controls">
					<button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
					<span>{quantity}</span>
					<button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
				</div>
				<button className="add-button" type="button" onClick={addToCart}>
					{added ? "Added" : "Add to cart"}
				</button>
			</div>
		</div>
	);
}

function ProductList({ products, onAdd }) {
	return (
		<div className="product-grid">
			{products.map((product) => (
				<ProductCard key={product.id} product={product} onAdd={onAdd} />
			))}
		</div>
	);
}

function HeaderComponent({ cartCount, showCart, onCartClick }) {
	return (
		<header className="top-bar">
			<div>
				<p className="eyebrow">REACT COMMERCE</p>
				<h1>Product Store</h1>
			</div>
			<button className="cart-button" type="button" onClick={onCartClick}>
				{showCart ? "Continue shopping" : "Cart"} <span>{cartCount}</span>
			</button>
		</header>
	);
}

function ProductComponent({ products, onAdd, loading, error }) {
	return (
		<>
			<div className="section-heading">
				<h2>Explore products</h2>
				<p>Fresh picks for your everyday life.</p>
			</div>
			{loading && <p className="status-message">Loading products...</p>}
			{error && <p className="status-message error-message">{error}</p>}
			{!loading && !error && <ProductList products={products} onAdd={onAdd} />}
		</>
	);
}

function Cart({ cart, onChangeQuantity, onRemove, onCheckout }) {
	const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

	return (
		<section className="cart-page">
			<div className="cart-items">
				<h2>Your cart</h2>
				{cart.length === 0 ? (
					<div className="empty-cart">Your cart is empty.</div>
				) : (
					cart.map((item) => (
						<div className="cart-item" key={item.id}>
							<img src={item.thumbnail} alt={item.title} />
							<div className="cart-item-details">
								<h3>{item.title}</h3>
								<p>${item.price} each</p>
								<div className="quantity-controls">
									<button type="button" onClick={() => onChangeQuantity(item.id, item.quantity - 1)}>-</button>
									<span>{item.quantity}</span>
									<button type="button" onClick={() => onChangeQuantity(item.id, item.quantity + 1)}>+</button>
								</div>
							</div>
							<div className="cart-item-actions">
								<strong>${(item.price * item.quantity).toFixed(2)}</strong>
								<button className="remove-button" type="button" onClick={() => onRemove(item.id)}>Remove</button>
							</div>
						</div>
					))
				)}
			</div>
			<div className="summary-box">
				<p>Subtotal</p>
				<strong>${total.toFixed(2)}</strong>
				<button className="checkout-button" type="button" onClick={onCheckout} disabled={cart.length === 0}>Checkout</button>
			</div>
		</section>
	);
}

function FooterComponent() {
	return (
		<footer className="footer">
			<p>Copyright. All rights reserved.</p>
		</footer>
	);
}

function App() {
	const [products, setProducts] = useState([]);
	const [cart, setCart] = useState(readCart);
	const [showCart, setShowCart] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetch("https://dummyjson.com/products")
			.then((response) => {
				if (!response.ok) throw new Error("Products could not be loaded");
				return response.json();
			})
			.then((data) => setProducts(data.products.slice(0, 20)))
			.catch(() => setError("Unable to load products. Please try again later."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		localStorage.setItem(CART_KEY, JSON.stringify(cart));
	}, [cart]);

	const addToCart = (product, quantity) => {
		setCart((currentCart) => {
			const existingItem = currentCart.find((item) => item.id === product.id);
			if (existingItem) {
				return currentCart.map((item) => item.id === product.id
					? { ...item, quantity: item.quantity + quantity }
					: item);
			}
			return [...currentCart, { ...product, quantity }];
		});
	};

	const changeQuantity = (id, quantity) => {
		if (quantity < 1) return;
		setCart((currentCart) => currentCart.map((item) => item.id === id ? { ...item, quantity } : item));
	};

	const removeFromCart = (id) => setCart((currentCart) => currentCart.filter((item) => item.id !== id));
	const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

	return (
		<div className="app">
			<HeaderComponent
				cartCount={cartCount}
				showCart={showCart}
				onCartClick={() => setShowCart(!showCart)}
			/>
			<main>
				{showCart
					? <Cart cart={cart} onChangeQuantity={changeQuantity} onRemove={removeFromCart} onCheckout={() => alert("Thank you for your order!")} />
					: <ProductComponent products={products} onAdd={addToCart} loading={loading} error={error} />}
			</main>
			<FooterComponent />
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);


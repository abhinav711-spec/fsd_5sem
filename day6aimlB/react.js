const { useEffect, useMemo, useState } = React;
const CART_KEY = "shoppingCart";
const PRODUCTS = [
	{
		id: "weekender-tote",
		title: "The Weekender Tote",
		category: "Everyday carry",
		price: 1899,
		description: "A roomy, sturdy canvas carryall for wherever the day takes you.",
		thumbnail: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
		badge: "BESTSELLER",
	},
	{
		id: "minimal-watch",
		title: "Minimalist Watch",
		category: "Accessories",
		price: 3299,
		description: "A clean dial and warm leather strap, made to go with everything.",
		thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
		badge: "JUST IN",
	},
	{
		id: "studio-headphones",
		title: "Studio Headphones",
		category: "Tech & audio",
		price: 2499,
		description: "Comfortable over-ear listening with a rich, balanced sound.",
		thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
		badge: "",
	},
	{
		id: "weekend-sneakers",
		title: "Weekend Sneakers",
		category: "Everyday carry",
		price: 2799,
		description: "Easygoing everyday sneakers with a pop of classic colour.",
		thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
		badge: "POPULAR",
	},
	{
		id: "instant-camera",
		title: "Instant Camera",
		category: "Tech & audio",
		price: 4599,
		description: "Bring favourite little moments to life, one photo at a time.",
		thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85",
		badge: "GIFT PICK",
	},
	{
		id: "amber-table-light",
		title: "Amber Table Light",
		category: "Home & living",
		price: 2199,
		description: "A warm ambient glow for slow evenings and quiet corners.",
		thumbnail: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
		badge: "",
	},
	{
		id: "everyday-sunglasses",
		title: "Everyday Sunglasses",
		category: "Accessories",
		price: 1499,
		description: "A timeless frame with UV protection for brighter days.",
		thumbnail: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85",
		badge: "",
	},
	{
		id: "weekend-backpack",
		title: "Weekend Backpack",
		category: "Everyday carry",
		price: 2399,
		description: "A lightweight, considered companion for commutes and getaways.",
		thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
		badge: "",
	},
];
const CATEGORIES = ["All pieces", ...new Set(PRODUCTS.map((product) => product.category))];
const formatPrice = (price) => new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0,
}).format(price);

function readCart() {
	try {
		const savedCart = JSON.parse(localStorage.getItem(CART_KEY));
		if (!Array.isArray(savedCart)) return [];
		return savedCart.flatMap((item) => {
			const product = PRODUCTS.find((entry) => entry.id === item?.id);
			const quantity = Number(item?.quantity);
			return product && Number.isInteger(quantity) && quantity > 0
				? [{ ...product, quantity }]
				: [];
		});
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
		window.setTimeout(() => setAdded(false), 900);
	};

	return (
		<article className="product-card">
			<div className="product-image-wrap">
				<img className="product-image" src={product.thumbnail} alt={product.title} loading="lazy" />
				{product.badge && <span className="product-badge">{product.badge}</span>}
				<span className="product-image-index">{String(PRODUCTS.indexOf(product) + 1).padStart(2, "0")}</span>
			</div>
			<div className="product-card-content">
				<p className="product-category">{product.category}</p>
				<h3>{product.title}</h3>
				<p className="product-description">{product.description}</p>
				<div className="product-buy-row">
					<p className="product-price">{formatPrice(product.price)}</p>
					<div className="quantity-controls" aria-label={`Quantity for ${product.title}`}>
						<button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
						<span>{quantity}</span>
						<button type="button" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}>+</button>
					</div>
				</div>
				<button className={`add-button${added ? " is-added" : ""}`} type="button" onClick={addToCart}>
					{added ? "Added to your bag" : "Add to bag"} <span aria-hidden="true">{added ? "✓" : "↗"}</span>
				</button>
			</div>
		</article>
	);
}

function ProductList({ products, onAdd }) {
	if (products.length === 0) {
		return <p className="empty-results">No pieces match that search. Try another term or category.</p>;
	}
	return (
		<div className="product-grid">
			{products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}
		</div>
	);
}

function HeaderComponent({ cartCount, showCart, onCartClick }) {
	return (
		<header className="top-bar">
			<a className="store-brand" href="./index.html" aria-label="React Commerce home">
				<span className="brand-mark">R</span>
				<span><strong>REACT</strong> COMMERCE<small>THE EVERYDAY EDIT</small></span>
			</a>
			<div className="header-note"><span>●</span> Considered finds for everyday living</div>
			<button className={`cart-button${showCart ? " cart-button-active" : ""}`} type="button" onClick={onCartClick}>
				{showCart ? "Continue shopping" : "Your bag"} <span className="cart-count">{cartCount}</span>
			</button>
		</header>
	);
}

function ProductComponent({ products, onAdd }) {
	const [category, setCategory] = useState("All pieces");
	const [search, setSearch] = useState("");
	const filteredProducts = useMemo(() => products.filter((product) => {
		const matchesCategory = category === "All pieces" || product.category === category;
		const query = search.trim().toLowerCase();
		const matchesSearch = !query || `${product.title} ${product.description} ${product.category}`.toLowerCase().includes(query);
		return matchesCategory && matchesSearch;
	}), [products, category, search]);

	return (
		<>
			<section className="store-hero">
				<div className="hero-copy">
					<p className="hero-kicker"><span>THE NEW EVERYDAY</span><i>NO. 01 / 2026</i></p>
					<h1>Good things,<br /><em>well chosen.</em></h1>
					<p className="hero-description">A little edit of useful, beautiful things. Picked with care, ready for your everyday.</p>
					<a className="hero-link" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
				</div>
				<div className="hero-art" aria-hidden="true">
					<div className="hero-orbit"></div>
					<div className="hero-stamp"><span>MADE FOR</span><strong>YOUR<br />EVERYDAY</strong><i>✳</i></div>
					<div className="hero-art-label">A GOOD FIND<br />IS A GOOD DAY.</div>
					<div className="hero-art-number">01</div>
				</div>
			</section>

			<section className="collection" id="collection">
				<div className="section-heading">
					<div>
						<p className="section-kicker">THE CURRENT EDIT <span>✦</span></p>
						<h2>Find your next favourite.</h2>
					</div>
					<p className="collection-count">{filteredProducts.length} considered finds</p>
				</div>
				<div className="collection-tools">
					<div className="category-list" aria-label="Filter by category">
						{CATEGORIES.map((item) => (
							<button
								className={`category-button${category === item ? " selected" : ""}`}
								key={item}
								type="button"
								aria-pressed={category === item}
								onClick={() => setCategory(item)}
							>
								{item}
							</button>
						))}
					</div>
					<label className="search-box">
						<span aria-hidden="true">⌕</span>
						<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a good thing" aria-label="Search products" />
					</label>
				</div>
				<ProductList products={filteredProducts} onAdd={onAdd} />
			</section>
		</>
	);
}

function Cart({ cart, onChangeQuantity, onRemove, onCheckout, onBrowse }) {
	const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

	return (
		<section className="cart-page">
			<div className="cart-items">
				<div className="cart-heading">
					<div><p className="section-kicker">YOUR SELECTION</p><h2>Your bag<span>.</span></h2></div>
					<button className="continue-link" type="button" onClick={onBrowse}>← Continue browsing</button>
				</div>
				{cart.length === 0 ? (
					<div className="empty-cart">
						<span className="empty-cart-mark">R</span>
						<h3>A good find is waiting.</h3>
						<p>Your bag is taking a little breather. Find something lovely to bring home.</p>
						<button className="empty-cart-link" type="button" onClick={onBrowse}>Explore the collection <span>→</span></button>
					</div>
				) : (
					cart.map((item) => (
						<article className="cart-item" key={item.id}>
							<img src={item.thumbnail} alt={item.title} />
							<div className="cart-item-details">
								<p className="product-category">{item.category}</p>
								<h3>{item.title}</h3>
								<p>{formatPrice(item.price)} each</p>
							</div>
							<div className="cart-item-actions">
								<strong>{formatPrice(item.price * item.quantity)}</strong>
								<div className="quantity-controls" aria-label={`Quantity for ${item.title}`}>
									<button type="button" aria-label="Decrease quantity" onClick={() => onChangeQuantity(item.id, item.quantity - 1)}>−</button>
									<span>{item.quantity}</span>
									<button type="button" aria-label="Increase quantity" onClick={() => onChangeQuantity(item.id, item.quantity + 1)}>+</button>
								</div>
								<button className="remove-button" type="button" onClick={() => onRemove(item.id)}>Remove</button>
							</div>
						</article>
					))
				)}
			</div>
			<aside className="summary-box">
				<p className="section-kicker">ORDER SUMMARY</p>
				<div className="summary-line"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
				<div className="summary-line"><span>Shipping</span><span className="shipping-note">Calculated at checkout</span></div>
				<div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
				<button className="checkout-button" type="button" onClick={onCheckout} disabled={cart.length === 0}>Continue to checkout <span>→</span></button>
				<p className="checkout-note"><span>✦</span> A thoughtful choice, delivered with care.</p>
			</aside>
		</section>
	);
}

function FooterComponent() {
	return (
		<footer className="footer">
			<a className="footer-brand" href="./index.html">REACT COMMERCE</a>
			<p>Good things for the everyday.</p>
			<span>MADE TO BE FOUND · EST. 2026</span>
		</footer>
	);
}

function App() {
	const [cart, setCart] = useState(readCart);
	const [showCart, setShowCart] = useState(false);

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
					? <Cart cart={cart} onChangeQuantity={changeQuantity} onRemove={removeFromCart} onCheckout={() => window.alert("Thank you for your order! Checkout is a demo.")} onBrowse={() => setShowCart(false)} />
					: <ProductComponent products={PRODUCTS} onAdd={addToCart} />}
			</main>
			<FooterComponent />
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

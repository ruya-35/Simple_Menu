const STORAGE_KEY = "addiseats_cart";
const CURRENCY = "ETB";
const PHONE_REGEX = /^(?:\+251|0)9\d{8}$/;
const FREE_DELIVERY_OVER = 1000;
const DELIVERY_FEE = 50;


const state = {
  dishes: [],
  cart: [],
  search: "",
  selectedCategory: "all"
};

const menuContainer = document.querySelector("#menu-items-container");
const searchInput = document.querySelector("#menu-search");
const categoryFiltersContainer = document.querySelector("#category-filters");
const cartItemsContainer = document.querySelector("#cart-items-container");
const cartTotalEl = document.querySelector("#cart-total");
const cartBadgeEl = document.querySelector("#cart-badge");

const cartToggleBtn = document.querySelector("#cart-toggle");
const closeSidebarBtn = document.querySelector("#close-sidebar");
const cartSidebar = document.querySelector("#cart-sidebar");


const checkoutBtn = document.querySelector("#checkout-btn");
const checkoutForm = document.querySelector("#checkout-form");
const nameInput = document.querySelector("#name");
const phoneInput = document.querySelector("#phone");
const areaSelect = document.querySelector("#area");
const formErrorEl = document.querySelector("#form-error");

async function loadMenu() {
  menuContainer.textContent = "Loading menu...";
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("HTTP error " + res.status);
    state.dishes = await res.json();  
    render();
  } catch (err) {
    menuContainer.textContent = "Could not load the menu.";
    console.error(err);
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); 
}

function loadCart() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    state.cart = JSON.parse(saved);   
}}

function cartTotal() {
  const total = state.cart.reduce((sum, item) => sum + (item?.price ?? 0) * (item?.qty ?? 1), 0);
  if (total === 0) return 0;
  if (total >= FREE_DELIVERY_OVER) return total;
  return total + DELIVERY_FEE;
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + (item?.qty ?? 0), 0);
}

function renderMenu() {
  const term = state.search.toLowerCase().trim();
  
  const filtered = state.dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(term);
    const matchesCategory = state.selectedCategory === "all" || dish.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    menuContainer.innerHTML = `<p>No dishes found matching your criteria.</p>`;
    return;
  }

  menuContainer.innerHTML = filtered.map(dish => `
    <article class="food-card" data-id="${dish.id}">
      <img src="${dish.image}" alt="${dish.name}">
      <h3>${dish.name}</h3>
      <div class="card-footer">
        <span class="price">${dish.price ?? 0} ${CURRENCY}</span>
        <button class="add-btn add" aria-label="Add to cart">Add</button>
      </div>
    </article>
  `).join("");
}

function renderLines() {
  cartItemsContainer.innerHTML = state.cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div>
        <p class="item-name">${item.name} <span class="qty">x${item.qty}</span></p>
        <p class="item-price">${(item.price ?? 0) * item.qty} ${CURRENCY}</p>
      </div>
      <button class="remove-btn">&times;</button>
    </div>
  `).join("");
}

function renderTotal() {
  cartTotalEl.textContent = `${cartTotal()} ${CURRENCY}`;
  cartBadgeEl.textContent = cartCount();
}

function renderCart() {
  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    renderTotal();
    
    if (checkoutForm) checkoutForm.classList.add("hidden");
    if (checkoutBtn) checkoutBtn.style.display = "block";
    return;
  }

  renderLines();
  renderTotal();
}

function render() {
  renderMenu();
  renderCart();
}


// Mobile Sidebar Listeners
if (cartToggleBtn && cartSidebar) {
  cartToggleBtn.addEventListener("click", () => {
    cartSidebar.classList.toggle("open");
  });
}

if (closeSidebarBtn && cartSidebar) {
  closeSidebarBtn.addEventListener("click", () => {
    cartSidebar.classList.remove("open");
  });
}

// Category Filter Listener
if (categoryFiltersContainer) {
  categoryFiltersContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-btn")) return;

    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");

    state.selectedCategory = e.target.dataset.category;
    renderMenu();
  });
}

// Search Listener
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  renderMenu();
});

// Add to Cart
menuContainer.addEventListener("click", (e) => {
  if (!e.target.matches(".add")) return;
  const card = e.target.closest(".food-card");
  const id = Number(card.dataset.id);
  const dish = state.dishes.find(d => d.id === id);
  const existingLine = state.cart.find(item => item.id === id);

  if (existingLine) {
    existingLine.qty++;
  } else {
    state.cart.push({ ...dish, qty: 1 });
  }

  saveCart();
  render();
});

// Remove from Cart
cartItemsContainer.addEventListener("click", (e) => {
  if (!e.target.matches(".remove-btn")) return;
  const itemEl = e.target.closest(".cart-item");
  const id = Number(itemEl.dataset.id);

  state.cart = state.cart.filter(item => item.id !== id);
  saveCart();
  render();
});

// Checkout Button Click
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (state.cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    checkoutForm.classList.remove("hidden");
    checkoutBtn.style.display = "none";
  });
}

//validator
function validate({ name, phone }) {
  if (!name.trim()) return "Please enter your name.";
  if (!PHONE_REGEX.test(phone)) return "Enter a valid phone number";
  if (state.cart.length === 0) return "Your cart is empty.";
  return "";
}

//ordering
function placeOrder(data) {
  const order = {
    ...data,
    items: state.cart,
    total: cartTotal(),
    placedAt: new Date().toISOString()
  };

  alert(`Thank you, ${order.name}! Your order of ${order.total} ${CURRENCY} has been placed.`);

  state.cart = [];
  saveCart();
  render();

  if (checkoutForm) {
    checkoutForm.reset();
    checkoutForm.classList.add("hidden");
  }
  if (checkoutBtn) checkoutBtn.style.display = "block";
  if (cartSidebar) cartSidebar.classList.remove("open");
}

// Form Submission
if (checkoutForm) {
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: nameInput?.value, 
      phone: phoneInput?.value ,
      area: areaSelect?.value
    };

    const msg = validate(data);
    if (formErrorEl) formErrorEl.textContent = msg;
    if (msg) return;

    placeOrder(data);
  });
}

async function init() {
  loadCart();
  await loadMenu();
}

init();
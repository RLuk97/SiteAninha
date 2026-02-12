// Estado da aplicação
let products = [];
let cart = [];
let currentCategory = 'all';
let currentSlide = 0;
let editingProductId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await initProducts();
  initCart();
  renderProducts();
  initSlider();
  initHeader();
});

// Produtos
async function initProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (res.ok && data?.ok && Array.isArray(data.items)) {
      products = data.items;
      saveProducts();
      return;
    }
  } catch {}
  const stored = localStorage.getItem('natura_products');
  products = stored ? JSON.parse(stored) : [...defaultProducts];
  saveProducts();

function saveProducts() {
  localStorage.setItem('natura_products', JSON.stringify(products));
}

function getFilteredProducts() {
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  return products.filter(p => {
    const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
    const matchesSearch = p.name.toLowerCase().includes(search) || 
                         p.description.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  
  const filtered = getFilteredProducts();
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="cart-empty" style="grid-column: 1/-1;">
        <div class="cart-empty-icon">📦</div>
        <h4>Nenhum produto encontrado</h4>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filtered.map(product => `
    <div class="product-card" onclick="openProductModal('${product.id}')">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-badge">${product.brand}</span>
        ${getStockBadge(product)}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="btn-add" onclick="event.stopPropagation(); addToCart('${product.id}')" 
            ${!product.isAvailable || product.stock === 0 ? 'disabled' : ''}>
            +
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function getStockBadge(product) {
  if (!product.isAvailable || product.stock === 0) {
    return `<div class="product-stock out"><span>Esgotado</span></div>`;
  }
  if (product.stock <= 5) {
    return `<span class="product-stock low">Últimas ${product.stock} un.</span>`;
  }
  return '';
}

function setCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  renderProducts();
}

function filterProducts() {
  renderProducts();
}

// Modal de Produto
function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.getElementById('productModal');
  const body = document.getElementById('modalBody');
  
  body.innerHTML = `
    <div class="product-modal-content">
      <div class="product-modal-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-modal-info">
        <span class="brand">${product.brand}</span>
        <h2>${product.name}</h2>
        <p class="description">${product.description}</p>
        <div class="price-stock">
          <span class="price">${formatPrice(product.price)}</span>
          <span class="stock ${getStockClass(product)}">${getStockText(product)}</span>
        </div>
        <div class="quantity-selector">
          <label>Quantidade:</label>
          <div class="quantity-control">
            <button onclick="updateModalQuantity(-1)">-</button>
            <span id="modalQuantity">1</span>
            <button onclick="updateModalQuantity(1)">+</button>
          </div>
        </div>
        <button class="btn-primary" onclick="addModalToCart('${product.id}')" 
          ${!product.isAvailable || product.stock === 0 ? 'disabled' : ''}>
          🛍 Adicionar ao Carrinho
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

let modalQuantity = 1;

function updateModalQuantity(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQuantity').textContent = modalQuantity;
}

function addModalToCart(productId) {
  addToCart(productId, modalQuantity);
  closeProductModal();
  modalQuantity = 1;
}

function getStockClass(product) {
  if (!product.isAvailable || product.stock === 0) return 'out';
  if (product.stock <= 5) return 'low';
  return 'in';
}

function getStockText(product) {
  if (!product.isAvailable || product.stock === 0) return 'Esgotado';
  if (product.stock <= 5) return `Apenas ${product.stock} unidades`;
  return 'Em estoque';
}

// Carrinho
function initCart() {
  const stored = localStorage.getItem('natura_cart');
  if (stored) {
    cart = JSON.parse(stored);
  }
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('natura_cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, quantity = 1) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.isAvailable || product.stock === 0) return;
  
  const existing = cart.find(item => item.product.id === productId);
  
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock);
  } else {
    cart.push({ product, quantity: Math.min(quantity, product.stock) });
  }
  
  saveCart();
  showNotification('Produto adicionado ao carrinho!');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  saveCart();
  renderCartItems();
}

function updateCartQuantity(productId, delta) {
  const item = cart.find(item => item.product.id === productId);
  if (!item) return;
  
  const newQuantity = item.quantity + delta;
  
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  if (newQuantity > item.product.stock) {
    showNotification('Quantidade máxima em estoque atingida!', 'warning');
    return;
  }
  
  item.quantity = newQuantity;
  saveCart();
  renderCartItems();
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  
  drawer.classList.toggle('active');
  overlay.classList.toggle('active');
  
  if (drawer.classList.contains('active')) {
    renderCartItems();
  }
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛍</div>
        <h4>Carrinho vazio</h4>
        <p>Adicione produtos para começar sua compra</p>
        <button class="btn-primary" onclick="toggleCart()">Continuar Comprando</button>
      </div>
    `;
    updateCartTotals();
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.product.image}" alt="${item.product.name}">
      </div>
      <div class="cart-item-info">
        <h4>${item.product.name}</h4>
        <span class="price">${formatPrice(item.product.price)}</span>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button onclick="updateCartQuantity('${item.product.id}', -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.product.id}', 1)">+</button>
          </div>
          <button class="btn-remove" onclick="removeFromCart('${item.product.id}')">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
  
  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= CONFIG.freeDeliveryThreshold ? 0 : CONFIG.deliveryFee;
  const total = subtotal + deliveryFee;
  
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('cartDelivery').textContent = deliveryFee === 0 ? 'GRÁTIS' : formatPrice(deliveryFee);
  document.getElementById('cartTotal').textContent = formatPrice(total);
  
  const deliveryInfo = document.getElementById('deliveryInfo');
  if (deliveryFee === 0) {
    deliveryInfo.innerHTML = '🎉 <strong>Parabéns!</strong> Você ganhou frete GRÁTIS!';
    deliveryInfo.classList.add('free');
  } else {
    const remaining = CONFIG.freeDeliveryThreshold - subtotal;
    deliveryInfo.innerHTML = `Faltam <strong>${formatPrice(remaining)}</strong> para frete grátis`;
    deliveryInfo.classList.remove('free');
  }
}

// Checkout
function openCheckout() {
  if (cart.length === 0) {
    showNotification('Adicione produtos ao carrinho primeiro!', 'warning');
    return;
  }
  
  toggleCart();
  
  const modal = document.getElementById('checkoutModal');
  const summary = document.getElementById('checkoutSummary');
  
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= CONFIG.freeDeliveryThreshold ? 0 : CONFIG.deliveryFee;
  const total = subtotal + deliveryFee;
  
  summary.innerHTML = `
    <div class="checkout-summary-item">
      <span>${cart.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="checkout-summary-item">
      <span>Entrega</span>
      <span style="color: ${deliveryFee === 0 ? 'var(--success)' : ''}">${deliveryFee === 0 ? 'GRÁTIS' : formatPrice(deliveryFee)}</span>
    </div>
    <div class="checkout-summary-item total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('active');
}

function handleCheckout(e) {
  e.preventDefault();
  
  const name = document.getElementById('checkoutName').value;
  const phone = document.getElementById('checkoutPhone').value;
  const address = document.getElementById('checkoutAddress').value;
  const payment = document.querySelector('input[name="payment"]:checked').value;
  
  const paymentLabels = {
    pix: 'PIX',
    dinheiro: 'Espécie',
    cartao: 'Cartão',
  };
  
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= CONFIG.freeDeliveryThreshold ? 0 : CONFIG.deliveryFee;
  const total = subtotal + deliveryFee;
  
  let message = `*🛍️ Novo Pedido - Natura & Avon*%0A%0A`;
  message += `*Cliente:* ${name}%0A`;
  message += `*Telefone:* ${phone}%0A`;
  message += `*Endereço:* ${address}%0A%0A`;
  
  message += `*📦 Produtos:*%0A`;
  cart.forEach(item => {
    message += `- ${item.product.name} (${item.quantity}x) = ${formatPrice(item.product.price * item.quantity)}%0A`;
  });
  
  message += `%0A*💰 Resumo:*%0A`;
  message += `Subtotal: ${formatPrice(subtotal)}%0A`;
  message += `Taxa de entrega: ${deliveryFee === 0 ? 'GRÁTIS' : formatPrice(deliveryFee)}%0A`;
  message += `*Total: ${formatPrice(total)}*%0A%0A`;
  
  message += `*💳 Forma de pagamento:* ${paymentLabels[payment]}%0A%0A`;
  message += `Aguardo confirmação do pedido! 💕`;
  
  const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
  
  // Limpa o carrinho
  cart = [];
  saveCart();
  closeCheckout();
  
  // Abre o WhatsApp
  window.open(whatsappUrl, '_blank');
  
  showNotification('Pedido enviado! Redirecionando para o WhatsApp...');
}

// Admin
function openAdmin() {
  document.getElementById('adminModal').classList.add('active');
  
  // Verifica se já está logado
  if (localStorage.getItem('admin_auth')) {
    showAdminPanel();
  } else {
    showAdminLogin();
  }
}

function closeAdmin() {
  document.getElementById('adminModal').classList.remove('active');
}

function showAdminLogin() {
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  updateAdminStats();
  renderAdminProducts();
}

function handleAdminLogin(e) {
  e.preventDefault();
  
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  
  fetch(`${CONFIG.backendBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, pass }),
  })
  .then(res => res.json().then(data => ({ ok: res.ok, data })))
  .then(({ ok, data }) => {
    if (ok && data.ok) {
      localStorage.setItem('admin_auth', 'true');
      showAdminPanel();
      showNotification('Login realizado com sucesso!');
    } else {
      showNotification('Usuário ou senha incorretos!', 'error');
    }
  })
  .catch(() => {
    if (user === CONFIG.adminUser && pass === CONFIG.adminPass) {
      localStorage.setItem('admin_auth', 'true');
      showAdminPanel();
      showNotification('Login realizado (modo offline).');
    } else {
      showNotification('Falha na autenticação. Tente novamente.', 'error');
    }
  });
}

function adminLogout() {
  localStorage.removeItem('admin_auth');
  showAdminLogin();
}

function updateAdminStats() {
  const total = products.length;
  const available = products.filter(p => p.isAvailable && p.stock > 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => !p.isAvailable || p.stock === 0).length;
  
  document.getElementById('adminTotalProducts').textContent = total;
  document.getElementById('adminAvailableProducts').textContent = available;
  document.getElementById('adminLowStockProducts').textContent = lowStock;
  document.getElementById('adminOutOfStockProducts').textContent = outOfStock;
}

function renderAdminProducts() {
  const container = document.getElementById('adminProducts');
  
  container.innerHTML = products.map(product => `
    <div class="admin-product-item">
      <img src="${product.image}" alt="${product.name}">
      <div class="admin-product-info">
        <h4>${product.name}</h4>
        <span>${product.brand} • ${categories[product.category]}</span>
      </div>
      <span class="admin-product-price">${formatPrice(product.price)}</span>
      <div class="admin-product-actions">
        <button class="btn-edit" onclick="editProduct('${product.id}')">✏</button>
        <button class="btn-delete" onclick="deleteProduct('${product.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function showAddProductForm() {
  editingProductId = null;
  document.getElementById('productFormTitle').textContent = 'Novo Produto';
  document.getElementById('editProductId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productDesc').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productStock').value = '';
  document.getElementById('productCategory').value = 'perfumes';
  document.getElementById('productBrand').value = 'Natura';
  document.getElementById('productImage').value = '';
  const fileInput = document.getElementById('productImageFile');
  const preview = document.getElementById('productImagePreview');
  if (fileInput) {
    fileInput.value = '';
    fileInput.required = true;
    fileInput.onchange = handleImageFileChange;
  }
  if (preview) {
    preview.innerHTML = '';
  }
  document.getElementById('productAvailable').checked = true;
  
  document.getElementById('productFormModal').classList.add('active');
}

function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  editingProductId = productId;
  document.getElementById('productFormTitle').textContent = 'Editar Produto';
  document.getElementById('editProductId').value = productId;
  document.getElementById('productName').value = product.name;
  document.getElementById('productDesc').value = product.description;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productBrand').value = product.brand;
  document.getElementById('productImage').value = product.image;
  document.getElementById('productAvailable').checked = product.isAvailable;
  const fileInput = document.getElementById('productImageFile');
  const preview = document.getElementById('productImagePreview');
  if (fileInput) {
    fileInput.value = '';
    fileInput.required = false;
    fileInput.onchange = handleImageFileChange;
  }
  if (preview) {
    setImagePreview(product.image);
  }
  
  document.getElementById('productFormModal').classList.add('active');
}

function closeProductForm() {
  document.getElementById('productFormModal').classList.remove('active');
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  
  const productData = {
    name: document.getElementById('productName').value,
    description: document.getElementById('productDesc').value,
    price: parseFloat(document.getElementById('productPrice').value),
    stock: parseInt(document.getElementById('productStock').value),
    category: document.getElementById('productCategory').value,
    brand: document.getElementById('productBrand').value,
    image: document.getElementById('productImage').value,
    isAvailable: document.getElementById('productAvailable').checked,
  };
  
  try {
    if (editingProductId) {
      const res = await fetch(`/api/products/${editingProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) products[index] = data.item;
        showNotification('Produto atualizado!');
      } else {
        throw new Error('Falha ao atualizar');
      }
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        products.unshift(data.item);
        showNotification('Produto criado!');
      } else {
        throw new Error('Falha ao criar');
      }
    }
  } catch {
    if (editingProductId) {
      const index = products.findIndex(p => p.id === editingProductId);
      if (index !== -1) products[index] = { ...products[index], ...productData };
      showNotification('Atualizado (offline)');
    } else {
      const newProduct = { id: Date.now().toString(), ...productData };
      products.unshift(newProduct);
      showNotification('Criado (offline)');
    }
  }
  
  saveProducts();
  renderProducts();
  updateAdminStats();
  renderAdminProducts();
  closeProductForm();
}

async function deleteProduct(productId) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  try {
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir');
  } catch {}
  products = products.filter(p => p.id !== productId);
  saveProducts();
  renderProducts();
  updateAdminStats();
  renderAdminProducts();
  showNotification('Produto excluído!');
}

// Slider
function initSlider() {
  const dots = document.getElementById('sliderDots');
  if (!dots) return;
  
  const slides = document.querySelectorAll('.slide');
  dots.innerHTML = Array.from(slides).map((_, i) => 
    `<button class="${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>`
  ).join('');
  
  setInterval(() => changeSlide(1), 5000);
}

function changeSlide(direction) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dots button');
  
  slides[currentSlide].classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  
  currentSlide = (currentSlide + direction + slides.length) % slides.length;
  
  slides[currentSlide].classList.add('active');
  dots[currentSlide]?.classList.add('active');
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dots button');
  
  slides[currentSlide].classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  
  currentSlide = index;
  
  slides[currentSlide].classList.add('active');
  dots[currentSlide]?.classList.add('active');
}

// Header scroll
function initHeader() {
  const header = document.getElementById('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Mobile menu
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('active');
}

// Contato
function handleContactSubmit(e) {
  e.preventDefault();
  showNotification('Mensagem enviada! Entraremos em contato em breve.');
  e.target.reset();
}

// Utilidades
function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

function showNotification(message, type = 'success') {
  // Cria elemento de notificação
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f97316' : '#f2a0a0'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 2000;
    font-size: 14px;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function handleImageFileChange() {
  const input = document.getElementById('productImageFile');
  const file = input?.files?.[0];
  if (!file) return;
  fetch(`${CONFIG.backendBaseUrl}/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  .then(res => res.json())
  .then(data => {
    if (data?.ok && data?.url) {
      const hidden = document.getElementById('productImage');
      if (hidden) hidden.value = data.url;
      setImagePreview(data.url);
      showNotification('Imagem enviada com sucesso!');
    } else {
      throw new Error('Upload falhou');
    }
  })
  .catch(() => {
    const reader = new FileReader();
    reader.onload = () => {
      const hidden = document.getElementById('productImage');
      if (hidden) hidden.value = reader.result;
      setImagePreview(reader.result);
      showNotification('Prévia local carregada (modo offline)');
    };
    reader.readAsDataURL(file);
  });
}

function setImagePreview(src) {
  const preview = document.getElementById('productImagePreview');
  if (!preview) return;
  if (!src) {
    preview.innerHTML = '';
    return;
  }
  preview.innerHTML = `
    <div class="product-image" style="margin-top: 10px;">
      <img src="${src}" alt="Prévia da imagem">
    </div>
  `;
}
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

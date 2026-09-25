/**
 * StorePulse - Customer Digital Storefront & WhatsApp Checkout Controller
 * Allows local neighborhood shoppers to browse stock and order via WhatsApp.
 */

const STOREFRONT_FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%231e293b%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2244%22 fill=%22%2364748b%22%3E%F0%9F%9B%8D%EF%B8%8F%3C/text%3E%3C/svg%3E";

window.handleProductImgError = function(img) {
  if (!img) return;
  img.onerror = null;
  img.src = STOREFRONT_FALLBACK_IMG;
};

class StorefrontController {
  constructor(storageService) {
    this.storage = storageService;
    this.cart = this.storage.getCart(); // [{ id, name, price, unit, qty, image, stock }]
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.deliveryType = 'pickup'; // 'pickup' or 'delivery'
    this.searchTimer = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Shopper Search with 150ms debounce to prevent input lag
    const searchInput = document.getElementById('shopperSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimer);
        const val = e.target.value;
        this.searchTimer = setTimeout(() => {
          this.searchQuery = val.toLowerCase().trim();
          this.renderProducts();
        }, 150);
      });
    }

    // Floating Cart Click
    const floatingCart = document.getElementById('floatingCartBar');
    if (floatingCart) {
      floatingCart.addEventListener('click', () => this.openCartDrawer());
    }

    // Close Cart Drawer
    const closeCartBtn = document.getElementById('closeCartDrawerBtn');
    const overlay = document.getElementById('cartDrawerOverlay');
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => this.closeCartDrawer());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeCartDrawer();
      });
    }

    // Delivery Type Selector
    const pickupBtn = document.getElementById('deliveryTypePickup');
    const homeBtn = document.getElementById('deliveryTypeHome');
    const addressBox = document.getElementById('deliveryAddressField');

    if (pickupBtn && homeBtn) {
      pickupBtn.addEventListener('click', () => {
        this.deliveryType = 'pickup';
        pickupBtn.classList.add('active');
        homeBtn.classList.remove('active');
        if (addressBox) addressBox.style.display = 'none';
      });

      homeBtn.addEventListener('click', () => {
        this.deliveryType = 'delivery';
        homeBtn.classList.add('active');
        pickupBtn.classList.remove('active');
        if (addressBox) addressBox.style.display = 'block';
      });
    }

    // WhatsApp Checkout Button
    const checkoutBtn = document.getElementById('whatsappCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.handleWhatsAppCheckout());
    }

    // Copy Order Text Button
    const copyOrderBtn = document.getElementById('copyOrderTextBtn');
    if (copyOrderBtn) {
      copyOrderBtn.addEventListener('click', () => this.copyOrderText());
    }
  }

  render() {
    this.renderStoreHero();
    this.renderCategories();
    this.renderProducts();
    this.updateCartUI();
  }

  renderStoreHero() {
    const profile = this.storage.getProfile();
    const nameEl = document.getElementById('storeHeroName');
    const tagEl = document.getElementById('storeHeroTagline');
    const hoursEl = document.getElementById('storeHeroHours');
    const addressEl = document.getElementById('storeHeroAddress');
    const phoneEl = document.getElementById('storeHeroPhone');

    if (nameEl) nameEl.textContent = profile.shopName || 'Local Mart';
    if (tagEl) tagEl.textContent = profile.tagline || 'Daily Provisions & Groceries';
    if (hoursEl) hoursEl.textContent = profile.openingHours || '8:00 AM - 10:00 PM';
    if (addressEl) addressEl.textContent = profile.address || 'Local Market';
    if (phoneEl) phoneEl.textContent = profile.phone || '';
  }

  renderCategories() {
    const items = this.storage.getInventory();
    const categories = {};

    items.forEach(i => {
      const cat = i.category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const scrollWrap = document.getElementById('storefrontCategoryScroll');
    if (!scrollWrap) return;

    const CATEGORY_ICONS = {
      'all': '✨',
      'Daily Uses & Groceries': '🛒',
      'Medicines & Healthcare': '💊',
      'Plumbing & Sanitary Supplies': '🔧',
      'Electrical & Wiring Supplies': '⚡',
      'Welding & Metal Fabrication': '🔥',
      'Construction, Masonry & Tools': '🏗️',
      'Electronics & Gadgets': '📱',
      'Beauty & Personal Care': '💄',
      'Study Materials & Stationery': '📚',
      'Gift Products & Hampers': '🎁',
      'Other Local Essentials': '🧴',
      'General': '📦'
    };

    let html = `
      <button class="cat-filter-btn ${this.activeCategory === 'all' ? 'active' : ''}" data-category="all" onclick="storefrontController.setCategory('all')">
        ✨ All Items <span class="cat-count-badge">${items.length}</span>
      </button>
    `;

    Object.keys(categories).sort().forEach(cat => {
      const isActive = this.activeCategory === cat ? 'active' : '';
      const icon = CATEGORY_ICONS[cat] || '🏷️';
      const escapedCat = this.escapeQuotes(cat);
      html += `
        <button class="cat-filter-btn ${isActive}" data-category="${escapedCat}" onclick="storefrontController.setCategory('${escapedCat}')">
          <span>${icon}</span> <span>${cat}</span> <span class="cat-count-badge">${categories[cat]}</span>
        </button>
      `;
    });

    scrollWrap.innerHTML = html;
  }

  setCategory(category) {
    if (this.activeCategory === category) return;
    this.activeCategory = category;

    // Fast active class toggle without destroying scrollbar position
    const scrollWrap = document.getElementById('storefrontCategoryScroll');
    if (scrollWrap) {
      const btns = scrollWrap.querySelectorAll('.cat-filter-btn');
      btns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
      });
    }

    this.renderProducts();
  }

  getActionBtnHtml(item, cartQty, stock, isOutOfStock) {
    if (isOutOfStock) {
      return `<button type="button" class="shopper-add-btn" disabled>Sold Out</button>`;
    } else if (cartQty > 0) {
      return `
        <div class="shopper-qty-pill">
          <button type="button" onclick="storefrontController.updateCartQty('${item.id}', -1)" aria-label="Decrease quantity">-</button>
          <span class="shopper-qty-val">${cartQty}</span>
          <button type="button" onclick="storefrontController.updateCartQty('${item.id}', 1)" ${cartQty >= stock ? 'disabled style="opacity:0.4"' : ''} aria-label="Increase quantity">+</button>
        </div>
      `;
    } else {
      return `
        <button type="button" class="shopper-add-btn" onclick="storefrontController.addToCart('${item.id}')">
          + Add to Basket
        </button>
      `;
    }
  }

  updateSingleProductCard(productId) {
    const slot = document.querySelector(`.shopper-action-slot[data-item-id="${productId}"]`);
    if (!slot) return;

    const item = this.storage.getInventory().find(i => i.id === productId);
    if (!item) return;

    const stock = parseInt(item.stock, 10) || 0;
    const isOutOfStock = stock <= 0;
    const cartItem = this.cart.find(c => c.id === productId);
    const cartQty = cartItem ? cartItem.qty : 0;

    slot.innerHTML = this.getActionBtnHtml(item, cartQty, stock, isOutOfStock);
  }

  renderProducts() {
    let items = this.storage.getInventory();
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    // Category Filter
    if (this.activeCategory !== 'all') {
      items = items.filter(i => i.category === this.activeCategory);
    }

    // Search Query
    if (this.searchQuery) {
      items = items.filter(i => 
        (i.name && i.name.toLowerCase().includes(this.searchQuery)) ||
        (i.category && i.category.toLowerCase().includes(this.searchQuery)) ||
        (i.description && i.description.toLowerCase().includes(this.searchQuery))
      );
    }

    const grid = document.getElementById('storefrontProductsGrid');
    const empty = document.getElementById('storefrontEmptyState');

    if (!grid) return;

    if (items.length === 0) {
      grid.style.display = 'none';
      if (empty) empty.style.display = 'flex';
      return;
    }

    if (empty) empty.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = items.map(item => {
      const stock = parseInt(item.stock, 10) || 0;
      const threshold = parseInt(item.lowStockThreshold, 10) || 5;
      const isOutOfStock = stock <= 0;
      const isLowStock = !isOutOfStock && stock <= threshold;

      let pillHtml = '';
      if (isOutOfStock) {
        pillHtml = `<span class="shopper-card-pill out">Out of Stock</span>`;
      } else if (isLowStock) {
        pillHtml = `<span class="shopper-card-pill low">Only ${stock} left!</span>`;
      } else {
        pillHtml = `<span class="shopper-card-pill in">Available</span>`;
      }

      // Check if already in cart
      const cartItem = this.cart.find(c => c.id === item.id);
      const cartQty = cartItem ? cartItem.qty : 0;
      const actionBtnHtml = this.getActionBtnHtml(item, cartQty, stock, isOutOfStock);
      const imgPlaceholder = item.image || STOREFRONT_FALLBACK_IMG;

      return `
        <div class="shopper-card" data-id="${item.id}">
          <div class="shopper-card-img-wrap">
            <img src="${imgPlaceholder}" alt="${this.escapeQuotes(item.name)}" class="shopper-card-img" loading="lazy" decoding="async" onerror="window.handleProductImgError(this);">
            ${pillHtml}
          </div>
          <div class="shopper-card-body">
            <div class="shopper-meta-row">
              <span class="shopper-cat-badge">${this.escapeQuotes(item.category || 'Essential')}</span>
              <span class="shopper-unit-badge">${this.escapeQuotes(item.unit || '1 pack')}</span>
            </div>
            <h3 class="shopper-card-title">${item.name}</h3>
            <p class="shopper-card-desc">${item.description || 'Quality product stocked fresh by your neighborhood store.'}</p>
            <div class="shopper-card-footer">
              <div class="shopper-price-box">
                <span class="shopper-price">${curr}${item.sellingPrice}</span>
              </div>
              <div class="shopper-action-slot" data-item-id="${item.id}">${actionBtnHtml}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Cart Actions (Optimized with Targeted Updates) ---
  addToCart(productId) {
    const item = this.storage.getInventory().find(i => i.id === productId);
    if (!item) return;

    const availableStock = parseInt(item.stock, 10) || 0;
    if (availableStock <= 0) {
      window.showToast("Sorry, this item is out of stock!", "warning");
      return;
    }

    const existing = this.cart.find(c => c.id === productId);
    if (existing) {
      if (existing.qty < availableStock) {
        existing.qty++;
      } else {
        window.showToast(`Only ${availableStock} units available in store`, 'warning');
      }
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: item.sellingPrice,
        unit: item.unit || '1 pc',
        qty: 1,
        stock: availableStock
      });
    }

    this.saveCart();
    this.updateSingleProductCard(productId); // Targeted DOM update! Zero lag!
    this.updateCartUI();
    window.showToast(`Added "${item.name}" to basket`, 'success');
  }

  updateCartQty(productId, delta) {
    const existing = this.cart.find(c => c.id === productId);
    if (!existing) return;

    const item = this.storage.getInventory().find(i => i.id === productId);
    const maxStock = item ? parseInt(item.stock, 10) : existing.stock;

    existing.qty += delta;

    if (existing.qty <= 0) {
      this.cart = this.cart.filter(c => c.id !== productId);
    } else if (existing.qty > maxStock) {
      existing.qty = maxStock;
      window.showToast(`Maximum available stock is ${maxStock}`, 'warning');
    }

    this.saveCart();
    this.updateSingleProductCard(productId); // Targeted DOM update! Zero lag!
    this.updateCartUI();

    // Re-render drawer only if open
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay && overlay.classList.contains('active')) {
      this.renderCartDrawerItems();
    }
  }

  saveCart() {
    this.storage.saveCart(this.cart);
  }

  updateCartUI() {
    const totalQty = this.cart.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = this.cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    const floatBar = document.getElementById('floatingCartBar');
    const floatCount = document.getElementById('floatingCartCount');
    const floatTotal = document.getElementById('floatingCartTotal');

    if (floatBar) {
      if (totalQty > 0) {
        floatBar.classList.add('show');
        if (floatCount) floatCount.textContent = `${totalQty} item${totalQty > 1 ? 's' : ''}`;
        if (floatTotal) floatTotal.textContent = `${curr}${totalAmount}`;
      } else {
        floatBar.classList.remove('show');
      }
    }

    const cartDrawerCount = document.getElementById('cartDrawerBadge');
    if (cartDrawerCount) cartDrawerCount.textContent = totalQty;
  }

  openCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.add('active');
    this.renderCartDrawerItems();
  }

  closeCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  renderCartDrawerItems() {
    const container = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotalAmount');
    const totalEl = document.getElementById('cartTotalAmount');
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:2rem 1rem">
          <div class="empty-icon">🛒</div>
          <h4>Your basket is empty</h4>
          <p>Add some items from the catalog to place your neighborhood order!</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = `${curr}0`;
      if (totalEl) totalEl.textContent = `${curr}0`;
      return;
    }

    let subtotal = 0;
    container.innerHTML = this.cart.map(item => {
      const lineTotal = item.qty * item.price;
      subtotal += lineTotal;

      return `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${curr}${item.price} / ${item.unit} • Sub: <strong>${curr}${lineTotal}</strong></div>
          </div>
          <div class="shopper-qty-pill">
            <button onclick="storefrontController.updateCartQty('${item.id}', -1)">-</button>
            <span class="shopper-qty-val">${item.qty}</span>
            <button onclick="storefrontController.updateCartQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = `${curr}${subtotal}`;
    if (totalEl) totalEl.textContent = `${curr}${subtotal}`;
  }

  // --- Order Generation & WhatsApp Integration ---
  buildOrderSummaryText() {
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';
    const custName = document.getElementById('custNameInput')?.value.trim() || 'Neighborhood Customer';
    const custPhone = document.getElementById('custPhoneInput')?.value.trim() || '';
    const custAddress = document.getElementById('custAddressInput')?.value.trim() || '';

    let total = 0;
    let itemsText = '';
    this.cart.forEach((item, index) => {
      const lineTotal = item.qty * item.price;
      total += lineTotal;
      itemsText += `${index + 1}. *${item.name}* (${item.unit}) × ${item.qty} = ${curr}${lineTotal}\n`;
    });

    const isDelivery = this.deliveryType === 'delivery';

    let orderMessage = `🛍️ *NEW STORE ORDER - ${profile.shopName}*\n`;
    orderMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    orderMessage += `👤 *Customer Name:* ${custName}\n`;
    if (custPhone) orderMessage += `📞 *Phone:* ${custPhone}\n`;
    orderMessage += `📦 *Order Type:* ${isDelivery ? '🏠 Home Delivery' : '🏪 In-Store Pickup'}\n`;
    if (isDelivery && custAddress) {
      orderMessage += `📍 *Delivery Address:* ${custAddress}\n`;
    }
    orderMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    orderMessage += `*ITEMS:* \n${itemsText}`;
    orderMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    orderMessage += `💰 *TOTAL PAYABLE:* ${curr}${total}\n`;
    if (profile.upiId) {
      orderMessage += `💳 *UPI for Payment:* ${profile.upiId}\n`;
    }
    orderMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    orderMessage += `Please confirm stock and let me know when it's ready! Thank you!`;

    return { orderMessage, total };
  }

  handleWhatsAppCheckout() {
    if (this.cart.length === 0) {
      window.showToast("Your basket is empty!", "warning");
      return;
    }

    const profile = this.storage.getProfile();
    const { orderMessage } = this.buildOrderSummaryText();

    let targetWhatsApp = profile.whatsappNumber || '919876543210';
    // Clean target WhatsApp number (digits only)
    targetWhatsApp = targetWhatsApp.replace(/\D/g, '');

    const encodedText = encodeURIComponent(orderMessage);
    const waUrl = `https://wa.me/${targetWhatsApp}?text=${encodedText}`;

    // Open WhatsApp in a new tab
    window.open(waUrl, '_blank');

    window.showToast("Opening WhatsApp with your formatted order!", "success");
  }

  copyOrderText() {
    if (this.cart.length === 0) {
      window.showToast("Your basket is empty!", "warning");
      return;
    }
    const { orderMessage } = this.buildOrderSummaryText();
    navigator.clipboard.writeText(orderMessage).then(() => {
      window.showToast("Order summary copied to clipboard!", "success");
    }).catch(() => {
      window.showToast("Could not copy order. Please check browser permissions.", "warning");
    });
  }

  escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
}

window.storefrontController = new StorefrontController(window.storageService);

/**
 * StorePulse - Merchant Inventory Controller
 * Handles table/grid rendering, search & filtering, live stock adjustments, and CRUD modals.
 */

class InventoryController {
  constructor(storageService, analyticsService) {
    this.storage = storageService;
    this.analytics = analyticsService;

    this.currentViewMode = 'table'; // 'table' or 'grid'
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedStatus = 'all'; // 'all', 'in-stock', 'low-stock', 'out-of-stock'
    this.sortBy = 'name_asc'; // 'name_asc', 'stock_asc', 'stock_desc', 'price_desc', 'price_asc'

    this.editingProductId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('merchantSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderItemsOnly();
      });
    }

    // Category filter dropdown
    const catSelect = document.getElementById('merchantCategorySelect');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.renderItemsOnly();
      });
    }

    // Status filter pills
    const statusPills = document.querySelectorAll('.filter-pill[data-status]');
    statusPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        statusPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedStatus = e.currentTarget.dataset.status;
        this.renderItemsOnly();
      });
    });

    // Sort select
    const sortSelect = document.getElementById('merchantSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderItemsOnly();
      });
    }

    // View mode toggle
    const tableBtn = document.getElementById('viewModeTable');
    const gridBtn = document.getElementById('viewModeGrid');
    if (tableBtn && gridBtn) {
      tableBtn.addEventListener('click', () => {
        this.currentViewMode = 'table';
        tableBtn.classList.add('active');
        gridBtn.classList.remove('active');
        this.renderItemsOnly();
      });
      gridBtn.addEventListener('click', () => {
        this.currentViewMode = 'grid';
        gridBtn.classList.add('active');
        tableBtn.classList.remove('active');
        this.renderItemsOnly();
      });
    }

    // Product Modal form triggers
    const addProductBtn = document.getElementById('openAddProductBtn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => this.openProductModal());
    }

    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.handleProductFormSubmit(e));
    }

    // Live margin calculation in modal
    const costInput = document.getElementById('prodCostPrice');
    const sellingInput = document.getElementById('prodSellingPrice');
    if (costInput && sellingInput) {
      const calcMargin = () => {
        const cost = parseFloat(costInput.value) || 0;
        const selling = parseFloat(sellingInput.value) || 0;
        const marginEl = document.getElementById('prodMarginPreview');
        if (marginEl) {
          if (selling > 0 && cost > 0) {
            const margin = Math.round(((selling - cost) / selling) * 100);
            marginEl.textContent = `Profit Margin: ~${margin}% (${window.storageService.getProfile().currency}${selling - cost} / unit)`;
            marginEl.style.color = margin >= 0 ? 'var(--primary)' : 'var(--danger)';
          } else {
            marginEl.textContent = '';
          }
        }
      };
      costInput.addEventListener('input', calcMargin);
      sellingInput.addEventListener('input', calcMargin);
    }
  }

  getFilteredItems() {
    let items = this.storage.getInventory();

    // 1. Filter by Search Query
    if (this.searchQuery) {
      items = items.filter(item => 
        (item.name && item.name.toLowerCase().includes(this.searchQuery)) ||
        (item.sku && item.sku.toLowerCase().includes(this.searchQuery)) ||
        (item.category && item.category.toLowerCase().includes(this.searchQuery))
      );
    }

    // 2. Filter by Category
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      items = items.filter(item => item.category === this.selectedCategory);
    }

    // 3. Filter by Status
    if (this.selectedStatus === 'in-stock') {
      items = items.filter(item => {
        const stock = parseInt(item.stock, 10) || 0;
        const threshold = parseInt(item.lowStockThreshold, 10) || 5;
        return stock > threshold;
      });
    } else if (this.selectedStatus === 'low-stock') {
      items = items.filter(item => {
        const stock = parseInt(item.stock, 10) || 0;
        const threshold = parseInt(item.lowStockThreshold, 10) || 5;
        return stock > 0 && stock <= threshold;
      });
    } else if (this.selectedStatus === 'out-of-stock') {
      items = items.filter(item => (parseInt(item.stock, 10) || 0) === 0);
    }

    // 4. Sort
    items.sort((a, b) => {
      if (this.sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (this.sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (this.sortBy === 'stock_asc') return (a.stock || 0) - (b.stock || 0);
      if (this.sortBy === 'stock_desc') return (b.stock || 0) - (a.stock || 0);
      if (this.sortBy === 'price_desc') return (b.sellingPrice || 0) - (a.sellingPrice || 0);
      if (this.sortBy === 'price_asc') return (a.sellingPrice || 0) - (b.sellingPrice || 0);
      return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
    });

    return items;
  }

  render() {
    this.renderMetrics();
    this.renderCategoryOptions();
    this.renderItemsOnly();
  }

  renderMetrics() {
    const metrics = this.analytics.getMetrics();
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    const elTotalSKU = document.getElementById('kpiTotalSKU');
    const elTotalUnits = document.getElementById('kpiTotalUnits');
    const elCostVal = document.getElementById('kpiCostValuation');
    const elRetailVal = document.getElementById('kpiRetailValuation');
    const elProfitMargin = document.getElementById('kpiProfitMargin');
    const elLowStock = document.getElementById('kpiLowStock');
    const elOutOfStock = document.getElementById('kpiOutOfStock');

    if (elTotalSKU) elTotalSKU.textContent = metrics.totalSKUs;
    if (elTotalUnits) elTotalUnits.textContent = metrics.totalUnits.toLocaleString();
    if (elCostVal) elCostVal.textContent = `${curr}${metrics.totalCostValuation.toLocaleString()}`;
    if (elRetailVal) elRetailVal.textContent = `${curr}${metrics.totalRetailValuation.toLocaleString()}`;
    if (elProfitMargin) elProfitMargin.textContent = `${metrics.profitMarginPercent}% Margin`;
    if (elLowStock) elLowStock.textContent = metrics.lowStockCount;
    if (elOutOfStock) elOutOfStock.textContent = metrics.outOfStockCount;

    // Attention Banner for low stock
    const banner = document.getElementById('stockAlertBanner');
    const bannerText = document.getElementById('stockAlertText');
    if (banner && bannerText) {
      if (metrics.lowStockCount > 0 || metrics.outOfStockCount > 0) {
        banner.classList.add('show');
        bannerText.innerHTML = `<strong>Attention Required:</strong> You have <strong>${metrics.outOfStockCount}</strong> out-of-stock items and <strong>${metrics.lowStockCount}</strong> items nearing threshold.`;
      } else {
        banner.classList.remove('show');
      }
    }
  }

  renderCategoryOptions() {
    const items = this.storage.getInventory();
    const categories = new Set();
    items.forEach(i => {
      if (i.category) categories.add(i.category);
    });

    const select = document.getElementById('merchantCategorySelect');
    if (select) {
      const currentVal = select.value;
      let html = '<option value="all">All Categories</option>';
      Array.from(categories).sort().forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
      });
      select.innerHTML = html;
      select.value = currentVal;
    }

    // Also populate modal category select
    const modalCatSelect = document.getElementById('prodCategory');
    if (modalCatSelect) {
      const defaultCategories = [
        "Daily Uses & Groceries",
        "Medicines & Healthcare",
        "Plumbing & Sanitary Supplies",
        "Electrical & Wiring Supplies",
        "Welding & Metal Fabrication",
        "Construction, Masonry & Tools",
        "Electronics & Gadgets",
        "Beauty & Personal Care",
        "Study Materials & Stationery",
        "Gift Products & Hampers",
        "Other Local Essentials"
      ];
      modalCatSelect.innerHTML = defaultCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  }

  renderItemsOnly() {
    const items = this.getFilteredItems();
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    const tableContainer = document.getElementById('merchantTableView');
    const gridContainer = document.getElementById('merchantGridView');
    const emptyState = document.getElementById('merchantEmptyState');

    if (items.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (gridContainer) gridContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (this.currentViewMode === 'table') {
      if (tableContainer) tableContainer.style.display = 'block';
      if (gridContainer) gridContainer.style.display = 'none';
      this.renderTable(items, curr);
    } else {
      if (tableContainer) tableContainer.style.display = 'none';
      if (gridContainer) gridContainer.style.display = 'grid';
      this.renderGrid(items, curr);
    }
  }

  renderTable(items, curr) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
      const stock = parseInt(item.stock, 10) || 0;
      const threshold = parseInt(item.lowStockThreshold, 10) || 5;
      const cost = parseFloat(item.costPrice) || 0;
      const selling = parseFloat(item.sellingPrice) || 0;
      const margin = selling > 0 ? Math.round(((selling - cost) / selling) * 100) : 0;

      let statusBadge = '';
      if (stock === 0) {
        statusBadge = `<span class="status-badge out-of-stock">● Out of Stock</span>`;
      } else if (stock <= threshold) {
        statusBadge = `<span class="status-badge low-stock">⚠️ Low Stock (${stock} left)</span>`;
      } else {
        statusBadge = `<span class="status-badge in-stock">● In Stock (${stock})</span>`;
      }

      const imgPlaceholder = item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60';

      return `
        <tr data-id="${item.id}">
          <td>
            <div class="product-cell">
              <img src="${imgPlaceholder}" alt="${item.name}" class="product-thumb" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60'">
              <div class="product-meta">
                <span class="product-title">${this.escapeHTML(item.name)}</span>
                <span class="product-sku">${this.escapeHTML(item.sku || 'NO-SKU')} • <span style="color:var(--text-secondary)">${this.escapeHTML(item.unit || '')}</span></span>
              </div>
            </div>
          </td>
          <td><span class="category-tag">${this.escapeHTML(item.category || 'General')}</span></td>
          <td>
            <div style="display:flex; flex-direction:column">
              <strong style="color:var(--primary)">${curr}${selling}</strong>
              <small style="color:var(--text-muted); font-size:0.75rem">Cost: ${curr}${cost} (${margin}% margin)</small>
            </div>
          </td>
          <td>
            <div class="quick-counter">
              <button type="button" class="counter-btn" onclick="inventoryController.quickAdjustStock('${item.id}', -1)" title="Decrease Stock by 1">-</button>
              <span class="counter-qty" id="stock_qty_${item.id}">${stock}</span>
              <button type="button" class="counter-btn" onclick="inventoryController.quickAdjustStock('${item.id}', 1)" title="Increase Stock by 1">+</button>
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="action-btn-icon" onclick="inventoryController.openEditModal('${item.id}')" title="Edit Item Details">
                ✏️
              </button>
              <button type="button" class="action-btn-icon" onclick="inventoryController.duplicateItem('${item.id}')" title="Duplicate Item">
                📑
              </button>
              <button type="button" class="action-btn-icon delete" onclick="inventoryController.confirmDeleteItem('${item.id}')" title="Delete Item">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderGrid(items, curr) {
    const grid = document.getElementById('merchantGridView');
    if (!grid) return;

    grid.innerHTML = items.map(item => {
      const stock = parseInt(item.stock, 10) || 0;
      const threshold = parseInt(item.lowStockThreshold, 10) || 5;
      const cost = parseFloat(item.costPrice) || 0;
      const selling = parseFloat(item.sellingPrice) || 0;
      const margin = selling > 0 ? Math.round(((selling - cost) / selling) * 100) : 0;

      let statusBadge = '';
      if (stock === 0) {
        statusBadge = `<span class="status-badge out-of-stock">● Out of Stock</span>`;
      } else if (stock <= threshold) {
        statusBadge = `<span class="status-badge low-stock">⚠️ Low (${stock})</span>`;
      } else {
        statusBadge = `<span class="status-badge in-stock">● ${stock} left</span>`;
      }

      const imgPlaceholder = item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';

      return `
        <div class="merchant-product-card" data-id="${item.id}">
          <div class="card-img-wrap">
            <img src="${imgPlaceholder}" alt="${item.name}" class="card-img" loading="lazy">
            <div class="card-badge-floating">${statusBadge}</div>
          </div>
          <div class="card-body">
            <span class="category-tag" style="align-self:flex-start; margin-bottom:0.4rem;">${this.escapeHTML(item.category || 'General')}</span>
            <h4 class="card-title">${this.escapeHTML(item.name)}</h4>
            <span class="product-sku">${this.escapeHTML(item.sku || '')} • ${this.escapeHTML(item.unit || '')}</span>
            <div class="card-prices">
              <span class="selling-price">${curr}${selling}</span>
              <span class="cost-price">${curr}${cost}</span>
              <span class="card-margin-badge">${margin}% margin</span>
            </div>
            <div class="card-footer">
              <div class="quick-counter">
                <button type="button" class="counter-btn" onclick="inventoryController.quickAdjustStock('${item.id}', -1)">-</button>
                <span class="counter-qty">${stock}</span>
                <button type="button" class="counter-btn" onclick="inventoryController.quickAdjustStock('${item.id}', 1)">+</button>
              </div>
              <div class="table-actions">
                <button type="button" class="action-btn-icon" onclick="inventoryController.openEditModal('${item.id}')" title="Edit">✏️</button>
                <button type="button" class="action-btn-icon delete" onclick="inventoryController.confirmDeleteItem('${item.id}')" title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  quickAdjustStock(productId, delta) {
    const oldStock = (this.storage.getInventory().find(i => i.id === productId)?.stock) || 0;
    const updated = this.storage.updateStock(productId, delta);
    if (updated) {
      // Re-render UI components smoothly
      this.renderMetrics();
      this.renderItemsOnly();
      
      // Also update storefront if customer view is watching
      if (window.storefrontController) {
        window.storefrontController.renderProducts();
      }

      // Record in Stock Assistant history if available
      if (window.stockAssistant) {
        window.stockAssistant.movementHistory.unshift({
          id: 'mov_' + Date.now(),
          productId: updated.id,
          productName: updated.name,
          sku: updated.sku || updated.id,
          mode: delta >= 0 ? 'IN' : 'OUT',
          qty: Math.abs(delta),
          delta: delta,
          previousStock: oldStock,
          newStock: updated.stock,
          source: 'Quick Adjust',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        if (window.stockAssistant.movementHistory.length > 20) window.stockAssistant.movementHistory.pop();
        window.stockAssistant.renderHistory();
      }

      if (updated.stock === 0) {
        window.showToast(`"${updated.name}" is now OUT OF STOCK!`, 'danger');
      } else if (updated.stock <= (updated.lowStockThreshold || 5) && delta < 0) {
        window.showToast(`Low stock warning: "${updated.name}" has only ${updated.stock} left.`, 'warning');
      } else {
        window.showToast(`${delta > 0 ? '+1' : '-1'} stock updated for "${updated.name}" (Now: ${updated.stock})`, delta > 0 ? 'success' : 'info');
      }
    }
  }

  openProductModal(productId = null) {
    this.editingProductId = productId;
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');

    if (!modal || !form) return;

    form.reset();

    if (productId) {
      modalTitle.textContent = "Edit Product Details";
      const item = this.storage.getInventory().find(i => i.id === productId);
      if (item) {
        document.getElementById('prodName').value = item.name || '';
        document.getElementById('prodCategory').value = item.category || 'Groceries & Staples';
        document.getElementById('prodSKU').value = item.sku || '';
        document.getElementById('prodCostPrice').value = item.costPrice || '';
        document.getElementById('prodSellingPrice').value = item.sellingPrice || '';
        document.getElementById('prodStock').value = item.stock || 0;
        document.getElementById('prodUnit').value = item.unit || '1 kg';
        document.getElementById('prodThreshold').value = item.lowStockThreshold || 5;
        document.getElementById('prodExpiry').value = item.expiry || '';
        document.getElementById('prodImageUrl').value = item.image || '';
        document.getElementById('prodDesc').value = item.description || '';

        // Trigger live margin preview
        const event = new Event('input');
        document.getElementById('prodSellingPrice').dispatchEvent(event);
      }
    } else {
      modalTitle.textContent = "Add New Product to Inventory";
      // Auto generate a SKU
      const randomCode = Math.floor(100 + Math.random() * 900);
      document.getElementById('prodSKU').value = `ITEM-${randomCode}`;
      document.getElementById('prodStock').value = '10';
      document.getElementById('prodThreshold').value = '5';
      document.getElementById('prodUnit').value = '1 pc / pack';
      document.getElementById('prodMarginPreview').textContent = '';
    }

    modal.classList.add('active');
  }

  closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    this.editingProductId = null;
  }

  handleProductFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('prodName').value.trim();
    if (!name) {
      window.showToast("Please provide a valid product name", "danger");
      return;
    }

    const payload = {
      name,
      category: document.getElementById('prodCategory').value,
      sku: document.getElementById('prodSKU').value.trim(),
      costPrice: parseFloat(document.getElementById('prodCostPrice').value) || 0,
      sellingPrice: parseFloat(document.getElementById('prodSellingPrice').value) || 0,
      stock: parseInt(document.getElementById('prodStock').value, 10) || 0,
      unit: document.getElementById('prodUnit').value.trim() || 'Piece',
      lowStockThreshold: parseInt(document.getElementById('prodThreshold').value, 10) || 5,
      expiry: document.getElementById('prodExpiry').value,
      image: document.getElementById('prodImageUrl').value.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
      description: document.getElementById('prodDesc').value.trim()
    };

    if (this.editingProductId) {
      this.storage.updateProduct(this.editingProductId, payload);
      window.showToast(`Updated "${name}" successfully`, 'success');
    } else {
      this.storage.addProduct(payload);
      window.showToast(`Added "${name}" to store inventory`, 'success');
    }

    this.closeProductModal();
    this.render();

    if (window.storefrontController) {
      window.storefrontController.render();
    }
  }

  duplicateItem(productId) {
    const item = this.storage.getInventory().find(i => i.id === productId);
    if (!item) return;

    const copy = {
      ...item,
      name: `${item.name} (Copy)`,
      sku: `${item.sku || 'SKU'}-CPY`,
      id: undefined
    };

    this.storage.addProduct(copy);
    this.render();
    window.showToast(`Duplicated "${item.name}"`, 'success');
  }

  confirmDeleteItem(productId) {
    const item = this.storage.getInventory().find(i => i.id === productId);
    if (!item) return;

    if (confirm(`Are you sure you want to remove "${item.name}" from inventory?`)) {
      this.storage.deleteProduct(productId);
      this.render();
      if (window.storefrontController) {
        window.storefrontController.render();
      }
      window.showToast(`Removed "${item.name}"`, 'warning');
    }
  }

  openEditModal(productId) {
    this.openProductModal(productId);
  }

  filterByLowStockAlert() {
    const lowStockPill = document.querySelector('.filter-pill[data-status="low-stock"]');
    if (lowStockPill) {
      lowStockPill.click();
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

window.inventoryController = new InventoryController(window.storageService, window.analyticsService);

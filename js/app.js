/**
 * StorePulse - Main Application Coordinator
 * Coordinates dual-mode switching, theme management, profile settings, and system toasts.
 */

// Toast notification helper
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '❌';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

class AppController {
  constructor() {
    this.activeView = 'merchant'; // 'merchant', 'customer', or 'services'
  }

  init() {
    this.initTheme();
    this.bindViewSwitcher();
    this.bindProfileModal();
    this.bindDataManagement();
    this.bindThemeToggle();

    // Initialize sub-controllers
    if (window.inventoryController) {
      window.inventoryController.init();
    }
    if (window.storefrontController) {
      window.storefrontController.init();
    }
    if (window.servicesController) {
      window.servicesController.init();
    }

    this.updateBrandHeader();
  }

  // --- Theme Management ---
  initTheme() {
    const savedTheme = window.storageService.getTheme() || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  bindThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        window.storageService.setTheme(nextTheme);
        this.updateThemeIcon(nextTheme);
        window.showToast(`Switched to ${nextTheme} theme`, 'success');
      });
    }
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // --- Multi-View Switching ---
  switchView(viewName) {
    const btnMerchant = document.getElementById('viewSwitchMerchant');
    const btnCustomer = document.getElementById('viewSwitchCustomer');
    const btnServices = document.getElementById('viewSwitchServices');
    const merchantView = document.getElementById('merchantViewContainer');
    const customerView = document.getElementById('customerViewContainer');
    const servicesView = document.getElementById('servicesViewContainer');

    this.activeView = viewName;

    // Reset buttons
    if (btnMerchant) btnMerchant.classList.toggle('active', viewName === 'merchant');
    if (btnCustomer) btnCustomer.classList.toggle('active', viewName === 'customer');
    if (btnServices) btnServices.classList.toggle('active', viewName === 'services');

    // Toggle views
    if (merchantView) merchantView.style.display = viewName === 'merchant' ? 'block' : 'none';
    if (customerView) customerView.style.display = viewName === 'customer' ? 'block' : 'none';
    if (servicesView) servicesView.style.display = viewName === 'services' ? 'block' : 'none';

    // Render / Refresh appropriate controller
    if (viewName === 'merchant' && window.inventoryController) {
      window.inventoryController.render();
    } else if (viewName === 'customer' && window.storefrontController) {
      window.storefrontController.render();
    } else if (viewName === 'services' && window.servicesController) {
      window.servicesController.renderDirectory();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindViewSwitcher() {
    const btnMerchant = document.getElementById('viewSwitchMerchant');
    const btnCustomer = document.getElementById('viewSwitchCustomer');
    const btnServices = document.getElementById('viewSwitchServices');

    if (btnMerchant) {
      btnMerchant.addEventListener('click', () => this.switchView('merchant'));
    }
    if (btnCustomer) {
      btnCustomer.addEventListener('click', () => this.switchView('customer'));
    }
    if (btnServices) {
      btnServices.addEventListener('click', () => this.switchView('services'));
    }

    const brandHome = document.getElementById('brandHeaderHome');
    if (brandHome) {
      brandHome.addEventListener('click', () => {
        if (this.activeView === 'merchant') {
          this.switchView('merchant');
        } else {
          this.switchView('customer');
        }
      });
    }
  }

  // --- Profile Settings Modal ---
  bindProfileModal() {
    const openBtn = document.getElementById('openProfileSettingsBtn');
    const modal = document.getElementById('profileModal');
    const closeBtn = document.getElementById('closeProfileModalBtn');
    const form = document.getElementById('profileForm');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        const profile = window.storageService.getProfile();
        document.getElementById('profileShopName').value = profile.shopName || '';
        document.getElementById('profileTagline').value = profile.tagline || '';
        document.getElementById('profileOwnerName').value = profile.ownerName || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileWhatsApp').value = profile.whatsappNumber || '';
        document.getElementById('profileUPI').value = profile.upiId || '';
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profileHours').value = profile.openingHours || '';
        document.getElementById('profileCurrency').value = profile.currency || '₹';

        modal.classList.add('active');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          shopName: document.getElementById('profileShopName').value.trim(),
          tagline: document.getElementById('profileTagline').value.trim(),
          ownerName: document.getElementById('profileOwnerName').value.trim(),
          phone: document.getElementById('profilePhone').value.trim(),
          whatsappNumber: document.getElementById('profileWhatsApp').value.trim(),
          upiId: document.getElementById('profileUPI').value.trim(),
          address: document.getElementById('profileAddress').value.trim(),
          openingHours: document.getElementById('profileHours').value.trim(),
          currency: document.getElementById('profileCurrency').value.trim() || '₹'
        };

        window.storageService.saveProfile(updated);
        modal.classList.remove('active');
        this.updateBrandHeader();

        if (window.inventoryController) window.inventoryController.render();
        if (window.storefrontController) window.storefrontController.render();

        window.showToast("Store profile updated successfully!", "success");
      });
    }
  }

  updateBrandHeader() {
    const profile = window.storageService.getProfile();
    const brandName = document.getElementById('headerShopName');
    const brandTagline = document.getElementById('headerTagline');
    if (brandName) brandName.textContent = profile.shopName;
    if (brandTagline) brandTagline.textContent = profile.tagline;
  }

  // --- Data Management (Export, Import, Reset) ---
  bindDataManagement() {
    // Export CSV
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        window.storageService.exportCSV();
        window.showToast("Inventory exported as CSV!", "success");
      });
    }

    // Export JSON Backup
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        window.storageService.exportJSON();
        window.showToast("Full backup file downloaded!", "success");
      });
    }

    // Reset Default Catalog
    const resetCatalogBtn = document.getElementById('resetCatalogBtn');
    if (resetCatalogBtn) {
      resetCatalogBtn.addEventListener('click', () => {
        if (confirm("Reset catalog to the default retail inventory and local service providers? Any custom additions will be overwritten.")) {
          window.storageService.resetDefaultCatalog();
          if (window.inventoryController) window.inventoryController.render();
          if (window.storefrontController) window.storefrontController.render();
          if (window.servicesController) {
            window.servicesController.renderDirectory();
            window.servicesController.renderMerchantServices();
          }
          window.showToast("Catalog & local service providers restored to default!", "success");
        }
      });
    }

    // Import JSON File
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = window.storageService.importJSON(event.target.result);
          if (result.success) {
            window.showToast(`Imported ${result.count} products successfully!`, "success");
            if (window.inventoryController) window.inventoryController.render();
            if (window.storefrontController) window.storefrontController.render();
            if (window.servicesController) {
              window.servicesController.renderDirectory();
              window.servicesController.renderMerchantServices();
            }
          } else {
            window.showToast(`Import failed: ${result.error}`, "danger");
          }
        };
        reader.readAsText(file);
        // Clear input
        e.target.value = '';
      });
    }
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
  window.appController.init();
});

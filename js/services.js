/**
 * StorePulse - Local Service Providers Controller
 * Manages neighborhood trades & doctor hiring directory, customer booking modal,
 * WhatsApp dispatch, and merchant partner management.
 */

class ServicesController {
  constructor(storageService) {
    this.storage = storageService;
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.selectedProvider = null;
    this.editingServiceId = null;
  }

  init() {
    this.bindEvents();
    this.renderDirectory();
    this.renderMerchantServices();
  }

  bindEvents() {
    // Search Services in Customer Directory with 150ms debounce
    const searchInput = document.getElementById('servicesSearchInput');
    if (searchInput) {
      let searchTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        const val = e.target.value;
        searchTimer = setTimeout(() => {
          this.searchQuery = val.toLowerCase().trim();
          this.renderDirectoryCards();
        }, 150);
      });
    }

    // Jump to Services from Storefront banner
    const jumpBtn = document.getElementById('btnJumpToServices');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        if (window.appController) {
          window.appController.switchView('services');
        }
      });
    }

    // Customer Booking Modal Close
    const closeBookingBtn = document.getElementById('closeServiceBookingBtn');
    const bookingOverlay = document.getElementById('serviceBookingModal');
    if (closeBookingBtn) {
      closeBookingBtn.addEventListener('click', () => this.closeBookingModal());
    }
    if (bookingOverlay) {
      bookingOverlay.addEventListener('click', (e) => {
        if (e.target === bookingOverlay) this.closeBookingModal();
      });
    }

    // Customer Booking Form Submit (WhatsApp + Local Storage)
    const bookingForm = document.getElementById('serviceBookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBookingSubmit(true);
      });
    }

    // Customer Save Booking without opening WhatsApp immediately
    const saveOnlyBtn = document.getElementById('serviceBookingSaveOnlyBtn');
    if (saveOnlyBtn) {
      saveOnlyBtn.addEventListener('click', () => {
        this.handleBookingSubmit(false);
      });
    }

    // Merchant Sub-tab navigation (Product Inventory vs Service Partners)
    const tabInventory = document.getElementById('merchantSubTabInventory');
    const tabServices = document.getElementById('merchantSubTabServices');
    const sectionInventory = document.getElementById('merchantInventorySection');
    const sectionServices = document.getElementById('merchantServicesSection');

    if (tabInventory && tabServices) {
      tabInventory.addEventListener('click', () => {
        tabInventory.classList.add('active');
        tabServices.classList.remove('active');
        if (sectionInventory) sectionInventory.style.display = 'block';
        if (sectionServices) sectionServices.style.display = 'none';
      });

      tabServices.addEventListener('click', () => {
        tabServices.classList.add('active');
        tabInventory.classList.remove('active');
        if (sectionInventory) sectionInventory.style.display = 'none';
        if (sectionServices) sectionServices.style.display = 'block';
        this.renderMerchantServices();
      });
    }

    // Merchant: Open Add Service Provider Modal
    const openAddServiceBtn = document.getElementById('openAddServiceBtn');
    if (openAddServiceBtn) {
      openAddServiceBtn.addEventListener('click', () => this.openMerchantServiceModal());
    }

    // Merchant Service Modal Close
    const closeMerchantServiceBtn = document.getElementById('closeMerchantServiceBtn');
    const merchantServiceOverlay = document.getElementById('merchantServiceModal');
    if (closeMerchantServiceBtn) {
      closeMerchantServiceBtn.addEventListener('click', () => this.closeMerchantServiceModal());
    }
    if (merchantServiceOverlay) {
      merchantServiceOverlay.addEventListener('click', (e) => {
        if (e.target === merchantServiceOverlay) this.closeMerchantServiceModal();
      });
    }

    // Merchant Service Form Submit (Add or Edit)
    const merchantServiceForm = document.getElementById('merchantServiceForm');
    if (merchantServiceForm) {
      merchantServiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMerchantServiceSubmit();
      });
    }
  }

  // =========================================================================
  // CUSTOMER SERVICES DIRECTORY
  // =========================================================================

  renderDirectory() {
    this.renderCategoryPills();
    this.renderDirectoryCards();
  }

  renderCategoryPills() {
    const wrap = document.getElementById('servicesCategoryScroll');
    if (!wrap) return;

    const services = this.storage.getServices();
    const categoriesCount = {};
    services.forEach(s => {
      const cat = s.category || 'General';
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    });

    const CATEGORY_META = {
      'all': { label: 'All Services', icon: '🌟' },
      'Plumber': { label: 'Plumbers', icon: '🔧' },
      'Electrician': { label: 'Electricians', icon: '⚡' },
      'Construction Worker / Mason': { label: 'Masons & Construction', icon: '🏗️' },
      'Doctor / General Physician': { label: 'Doctors & Physicians', icon: '🩺' },
      'Welder / Fabricator': { label: 'Welders & Metal', icon: '🔥' },
      'Carpenter': { label: 'Carpenters', icon: '🪚' },
      'Painter': { label: 'Painters', icon: '🎨' },
      'AC & Appliance Repair': { label: 'AC & Appliances', icon: '❄️' },
      'Diagnostic & Pathology': { label: 'Diagnostic Labs', icon: '🧪' }
    };

    let html = `
      <button type="button" class="cat-filter-btn ${this.activeCategory === 'all' ? 'active' : ''}" onclick="servicesController.setCategory('all')">
        <span>🌟</span> <span>All Services</span> <span class="cat-count-badge">${services.length}</span>
      </button>
    `;

    Object.keys(CATEGORY_META).forEach(cat => {
      if (cat === 'all') return;
      const count = categoriesCount[cat] || 0;
      if (count > 0) {
        const meta = CATEGORY_META[cat];
        const isActive = this.activeCategory === cat ? 'active' : '';
        html += `
          <button type="button" class="cat-filter-btn ${isActive}" onclick="servicesController.setCategory('${this.escapeQuotes(cat)}')">
            <span>${meta.icon}</span> <span>${meta.label}</span> <span class="cat-count-badge">${count}</span>
          </button>
        `;
      }
    });

    wrap.innerHTML = html;
  }

  setCategory(category) {
    this.activeCategory = category;
    this.renderCategoryPills();
    this.renderDirectoryCards();
  }

  getFilteredServices() {
    let services = this.storage.getServices();

    if (this.activeCategory !== 'all') {
      services = services.filter(s => s.category === this.activeCategory);
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      services = services.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const titleMatch = (s.title || '').toLowerCase().includes(q);
        const catMatch = (s.category || '').toLowerCase().includes(q);
        const descMatch = (s.description || '').toLowerCase().includes(q);
        const specsMatch = (s.specialties || []).some(sp => sp.toLowerCase().includes(q));
        const addressMatch = (s.address || '').toLowerCase().includes(q);
        return nameMatch || titleMatch || catMatch || descMatch || specsMatch || addressMatch;
      });
    }

    return services;
  }

  renderDirectoryCards() {
    const grid = document.getElementById('servicesDirectoryGrid');
    const empty = document.getElementById('servicesEmptyState');
    if (!grid) return;

    const services = this.getFilteredServices();
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    if (services.length === 0) {
      grid.style.display = 'none';
      if (empty) empty.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = services.map(s => {
      const isAvailable = (s.status || 'available') === 'available';
      const statusPillClass = isAvailable ? 'status-pill in-stock' : 'status-pill low-stock';
      const statusText = isAvailable ? '● Available Today' : '● Busy on Site';

      const badgesHtml = (s.badges || ['Verified Pro']).map(b => 
        `<span class="pro-chip-badge">🛡️ ${b}</span>`
      ).join('');

      const specialtiesHtml = (s.specialties || []).slice(0, 4).map(sp => 
        `<span class="pro-specialty-tag">${sp}</span>`
      ).join('');

      const cleanPhone = (s.phone || '').replace(/\s+/g, '');
      const defaultImg = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60";

      return `
        <article class="pro-card" data-service-id="${s.id}">
          <div class="pro-card-header">
            <div class="pro-avatar-frame">
              <img src="${s.image || defaultImg}" alt="${s.name}" class="pro-avatar-img" onerror="this.onerror=null; this.src='${defaultImg}';" loading="lazy" decoding="async">
              <span class="pro-verified-check" title="Verified Background & Skill">✓</span>
            </div>
            <div class="pro-header-details">
              <div class="pro-category-tag">${s.category}</div>
              <h3 class="pro-name">${s.name}</h3>
              <p class="pro-title">${s.title || 'Local Professional'}</p>
            </div>
          </div>

          <div class="pro-rating-row">
            <div class="pro-rating-badge">
              <span>⭐</span> <strong>${Number(s.rating || 4.9).toFixed(1)}</strong>
              <span style="color:var(--text-muted); font-size:0.75rem">(${s.reviewsCount || 100}+ jobs)</span>
            </div>
            <span class="${statusPillClass}">${statusText}</span>
          </div>

          <div class="pro-stats-strip">
            <div class="pro-stat-item">
              <span class="stat-label">Experience</span>
              <span class="stat-value">${s.experience || '8+ Years'}</span>
            </div>
            <div class="pro-stat-item">
              <span class="stat-label">Visiting / Consult</span>
              <span class="stat-value highlight">${curr}${s.visitingFee || 200}</span>
            </div>
            <div class="pro-stat-item">
              <span class="stat-label">Service Area</span>
              <span class="stat-value" title="${s.address || 'Doorstep Service'}">📍 Local Hub</span>
            </div>
          </div>

          <p class="pro-desc">${s.description || 'Verified local service provider offering fast and dependable assistance.'}</p>

          <div class="pro-specialties-wrap">
            <span class="specialties-title">Key Specialties:</span>
            <div class="pro-specialties-list">
              ${specialtiesHtml}
            </div>
          </div>

          <div class="pro-card-badges">
            ${badgesHtml}
          </div>

          <div class="pro-card-actions">
            <a href="tel:${cleanPhone}" class="btn btn-secondary pro-call-btn" title="Call directly">
              <span>📞</span> Call Now
            </a>
            <button type="button" class="btn btn-primary pro-hire-btn" onclick="servicesController.openBookingModal('${s.id}')">
              <span>💬</span> Hire / WhatsApp Book
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // CUSTOMER BOOKING MODAL & WHATSAPP
  // =========================================================================

  openBookingModal(serviceId) {
    const services = this.storage.getServices();
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    this.selectedProvider = service;
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    const modal = document.getElementById('serviceBookingModal');
    const headerEl = document.getElementById('serviceBookingHeader');
    const taskSelect = document.getElementById('bookingTaskSelect');
    const dateInput = document.getElementById('bookingDateInput');

    if (headerEl) {
      headerEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.85rem">
          <img src="${service.image}" alt="${service.name}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid var(--primary)">
          <div>
            <div style="font-weight:700; font-size:1.05rem; color:var(--text-primary)">${service.name}</div>
            <div style="font-size:0.82rem; color:var(--primary); font-weight:600">${service.category} • ${service.title}</div>
            <div style="font-size:0.78rem; color:var(--text-muted)">Visiting Fee: <strong style="color:var(--text-primary)">${curr}${service.visitingFee}</strong> • Rating: ⭐ ${Number(service.rating).toFixed(1)}</div>
          </div>
        </div>
      `;
    }

    // Populate task options from provider's specialties
    if (taskSelect) {
      let optionsHtml = '<option value="">-- Choose Task or Issue --</option>';
      (service.specialties || []).forEach(sp => {
        optionsHtml += `<option value="${this.escapeQuotes(sp)}">${sp}</option>`;
      });
      optionsHtml += '<option value="General Inspection / Diagnosis">General Inspection / Diagnosis</option>';
      optionsHtml += '<option value="Emergency Repair Request">Emergency Urgent Repair</option>';
      optionsHtml += '<option value="Custom Requirement">Other / Custom Job</option>';
      taskSelect.innerHTML = optionsHtml;
    }

    // Set default date to today
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
      dateInput.min = today;
    }

    if (modal) modal.classList.add('active');
  }

  closeBookingModal() {
    const modal = document.getElementById('serviceBookingModal');
    if (modal) modal.classList.remove('active');
    this.selectedProvider = null;
  }

  handleBookingSubmit(launchWhatsApp = true) {
    if (!this.selectedProvider) return;

    const taskSelect = document.getElementById('bookingTaskSelect');
    const descInput = document.getElementById('bookingDescriptionInput');
    const dateInput = document.getElementById('bookingDateInput');
    const slotSelect = document.getElementById('bookingSlotSelect');
    const nameInput = document.getElementById('bookingCustomerName');
    const phoneInput = document.getElementById('bookingCustomerPhone');
    const addressInput = document.getElementById('bookingCustomerAddress');

    const task = taskSelect ? taskSelect.value.trim() : 'General Service';
    const problemDesc = descInput ? descInput.value.trim() : '';
    const date = dateInput ? dateInput.value : '';
    const slot = slotSelect ? slotSelect.value : 'Morning (9:00 AM - 12:00 PM)';
    const custName = nameInput ? nameInput.value.trim() : '';
    const custPhone = phoneInput ? phoneInput.value.trim() : '';
    const custAddress = addressInput ? addressInput.value.trim() : '';

    if (!task) {
      window.showToast("Please choose the service task needed.", "warning");
      return;
    }
    if (!custName || !custPhone) {
      window.showToast("Please enter your name and contact phone.", "warning");
      return;
    }

    const bookingRecord = {
      serviceId: this.selectedProvider.id,
      serviceName: this.selectedProvider.name,
      serviceCategory: this.selectedProvider.category,
      servicePhone: this.selectedProvider.phone,
      serviceWhatsApp: this.selectedProvider.whatsapp,
      visitingFee: this.selectedProvider.visitingFee,
      task: task,
      problemDesc: problemDesc,
      date: date,
      timeSlot: slot,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress
    };

    // Save in LocalStorage
    const savedBooking = this.storage.addServiceBooking(bookingRecord);

    if (launchWhatsApp) {
      // Build WhatsApp message
      const profile = this.storage.getProfile();
      const curr = profile.currency || '₹';
      const cleanWa = (this.selectedProvider.whatsapp || this.selectedProvider.phone || '').replace(/[^0-9]/g, '');

      let msg = `*🛠️ SERVICE APPOINTMENT REQUEST*\n`;
      msg += `--------------------------------\n`;
      msg += `*To:* ${this.selectedProvider.name} (${this.selectedProvider.category})\n`;
      msg += `*Ref Booking ID:* #${savedBooking.id.toUpperCase()}\n\n`;
      msg += `*📋 Service Needed:* ${task}\n`;
      if (problemDesc) {
        msg += `*📝 Issue Details:* ${problemDesc}\n`;
      }
      msg += `*📅 Preferred Date:* ${date || 'Earliest Available'}\n`;
      msg += `*⏰ Preferred Slot:* ${slot}\n`;
      msg += `*💰 Visiting Fee:* ${curr}${this.selectedProvider.visitingFee}\n\n`;
      msg += `*👤 Customer Name:* ${custName}\n`;
      msg += `*📞 Customer Phone:* ${custPhone}\n`;
      if (custAddress) {
        msg += `*📍 Doorstep Address:* ${custAddress}\n`;
      }
      msg += `\n_Sent via ${profile.shopName || 'Local Buddy'} Verified Neighborhood Services_`;

      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }

    window.showToast(`Booking inquiry sent for ${this.selectedProvider.name}!`, "success");
    this.closeBookingModal();

    // Reset form
    if (document.getElementById('serviceBookingForm')) {
      document.getElementById('serviceBookingForm').reset();
    }

    // Refresh merchant view if open
    this.renderMerchantServices();
  }

  // =========================================================================
  // MERCHANT SERVICE PARTNERS & BOOKING LEADS MANAGEMENT
  // =========================================================================

  renderMerchantServices() {
    this.renderMerchantKPIs();
    this.renderMerchantProvidersTable();
    this.renderMerchantBookingsTable();
  }

  renderMerchantKPIs() {
    const services = this.storage.getServices();
    const bookings = this.storage.getServiceBookings();

    const totalPros = services.length;
    const availablePros = services.filter(s => (s.status || 'available') === 'available').length;
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;

    const elTotalPros = document.getElementById('kpiTotalServicePros');
    const elAvailablePros = document.getElementById('kpiAvailableServicePros');
    const elTotalBookings = document.getElementById('kpiTotalServiceBookings');
    const elPendingBookings = document.getElementById('kpiPendingServiceBookings');

    if (elTotalPros) elTotalPros.textContent = totalPros;
    if (elAvailablePros) elAvailablePros.textContent = availablePros;
    if (elTotalBookings) elTotalBookings.textContent = totalBookings;
    if (elPendingBookings) elPendingBookings.textContent = pendingBookings;
  }

  renderMerchantProvidersTable() {
    const tbody = document.getElementById('merchantServicesTableBody');
    if (!tbody) return;

    const services = this.storage.getServices();
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    if (services.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted)">
            No service providers registered yet. Click "+ Add Service Partner" above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = services.map(s => {
      const isAvailable = (s.status || 'available') === 'available';
      const statusBadge = isAvailable 
        ? `<span class="status-pill in-stock" style="cursor:pointer" onclick="servicesController.toggleAvailability('${s.id}')" title="Click to toggle availability">🟢 Available</span>`
        : `<span class="status-pill low-stock" style="cursor:pointer" onclick="servicesController.toggleAvailability('${s.id}')" title="Click to toggle availability">🟡 Busy</span>`;

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:0.75rem">
              <img src="${s.image}" alt="${s.name}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
              <div>
                <div style="font-weight:700; color:var(--text-primary)">${s.name}</div>
                <div style="font-size:0.78rem; color:var(--text-muted)">${s.title || ''}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="category-badge">${s.category}</span>
          </td>
          <td>
            <div style="font-size:0.85rem">📞 ${s.phone || 'N/A'}</div>
            <div style="font-size:0.78rem; color:var(--text-muted)">💬 WA: ${s.whatsapp || s.phone}</div>
          </td>
          <td>
            <strong style="color:var(--text-primary)">${curr}${s.visitingFee || 200}</strong>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <div style="display:flex; gap:0.4rem">
              <button type="button" class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem" onclick="servicesController.openMerchantServiceModal('${s.id}')" title="Edit Partner">
                ✏️ Edit
              </button>
              <button type="button" class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem; color:var(--danger)" onclick="servicesController.deleteService('${s.id}')" title="Remove Partner">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderMerchantBookingsTable() {
    const tbody = document.getElementById('merchantBookingsTableBody');
    if (!tbody) return;

    const bookings = this.storage.getServiceBookings();
    const profile = this.storage.getProfile();
    const curr = profile.currency || '₹';

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted)">
            No customer booking requests yet. Inquiries made from the "Hire Services" tab will appear here in real-time.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      let statusColor = 'var(--warning)';
      if (b.status === 'Confirmed') statusColor = 'var(--accent-indigo)';
      if (b.status === 'Completed') statusColor = 'var(--success)';
      if (b.status === 'Cancelled') statusColor = 'var(--danger)';

      const cleanPhone = (b.customerPhone || '').replace(/[^0-9]/g, '');

      return `
        <tr>
          <td>
            <strong style="font-family:monospace; color:var(--primary)">#${b.id.slice(-6).toUpperCase()}</strong>
            <div style="font-size:0.72rem; color:var(--text-muted)">${new Date(b.createdAt).toLocaleDateString()}</div>
          </td>
          <td>
            <div style="font-weight:600">${b.customerName}</div>
            <div style="font-size:0.78rem; color:var(--text-muted)">${b.customerPhone}</div>
          </td>
          <td>
            <div style="font-weight:600; color:var(--text-primary)">${b.serviceName}</div>
            <span class="category-badge" style="font-size:0.7rem">${b.serviceCategory}</span>
          </td>
          <td>
            <div style="font-size:0.85rem">${b.task}</div>
            ${b.problemDesc ? `<div style="font-size:0.75rem; color:var(--text-muted)">"${b.problemDesc}"</div>` : ''}
          </td>
          <td>
            <div style="font-size:0.82rem">${b.date || 'Today'}</div>
            <div style="font-size:0.72rem; color:var(--text-muted)">${b.timeSlot}</div>
          </td>
          <td>
            <select class="select-control" style="padding:0.25rem 0.5rem; font-size:0.78rem; border-color:${statusColor}" onchange="servicesController.changeBookingStatus('${b.id}', this.value)">
              <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
              <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>🤝 Confirmed</option>
              <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
              <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
          <td>
            <a href="https://wa.me/${cleanPhone}" target="_blank" class="btn btn-secondary" style="padding:0.3rem 0.5rem; font-size:0.75rem" title="Chat with Customer">
              💬 WhatsApp
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  toggleAvailability(serviceId) {
    const updated = this.storage.toggleServiceAvailability(serviceId);
    if (updated) {
      window.showToast(`${updated.name} is now ${updated.status === 'available' ? 'Available' : 'Busy'}`, "success");
      this.renderMerchantServices();
      this.renderDirectoryCards();
    }
  }

  changeBookingStatus(bookingId, status) {
    this.storage.updateBookingStatus(bookingId, status);
    window.showToast(`Booking marked as ${status}`, "success");
    this.renderMerchantKPIs();
  }

  deleteService(serviceId) {
    if (confirm("Are you sure you want to remove this service provider?")) {
      this.storage.deleteService(serviceId);
      window.showToast("Service provider removed", "success");
      this.renderMerchantServices();
      this.renderDirectory();
    }
  }

  // =========================================================================
  // MERCHANT ADD / EDIT SERVICE PROVIDER MODAL
  // =========================================================================

  openMerchantServiceModal(serviceId = null) {
    this.editingServiceId = serviceId;
    const modal = document.getElementById('merchantServiceModal');
    const titleEl = document.getElementById('merchantServiceModalTitle');
    const form = document.getElementById('merchantServiceForm');

    if (!modal) return;

    if (serviceId) {
      const services = this.storage.getServices();
      const service = services.find(s => s.id === serviceId);
      if (service) {
        if (titleEl) titleEl.textContent = "Edit Service Partner";
        document.getElementById('mspName').value = service.name || '';
        document.getElementById('mspCategory').value = service.category || 'Plumber';
        document.getElementById('mspTitle').value = service.title || '';
        document.getElementById('mspPhone').value = service.phone || '';
        document.getElementById('mspWhatsApp').value = service.whatsapp || '';
        document.getElementById('mspExperience').value = service.experience || '';
        document.getElementById('mspVisitingFee').value = service.visitingFee || 200;
        document.getElementById('mspAddress').value = service.address || '';
        document.getElementById('mspImage').value = service.image || '';
        document.getElementById('mspSpecialties').value = (service.specialties || []).join(', ');
        document.getElementById('mspDesc').value = service.description || '';
      }
    } else {
      if (titleEl) titleEl.textContent = "Add New Service Partner";
      if (form) form.reset();
    }

    modal.classList.add('active');
  }

  closeMerchantServiceModal() {
    const modal = document.getElementById('merchantServiceModal');
    if (modal) modal.classList.remove('active');
    this.editingServiceId = null;
  }

  handleMerchantServiceSubmit() {
    const name = document.getElementById('mspName').value.trim();
    const category = document.getElementById('mspCategory').value;
    const title = document.getElementById('mspTitle').value.trim();
    const phone = document.getElementById('mspPhone').value.trim();
    const whatsapp = document.getElementById('mspWhatsApp').value.trim() || phone.replace(/[^0-9]/g, '');
    const experience = document.getElementById('mspExperience').value.trim() || '5+ Years';
    const visitingFee = parseFloat(document.getElementById('mspVisitingFee').value) || 200;
    const address = document.getElementById('mspAddress').value.trim();
    const image = document.getElementById('mspImage').value.trim() || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60";
    const specialtiesRaw = document.getElementById('mspSpecialties').value.trim();
    const description = document.getElementById('mspDesc').value.trim();

    const specialties = specialtiesRaw 
      ? specialtiesRaw.split(',').map(s => s.trim()).filter(Boolean)
      : ['General Maintenance', 'Inspection & Repairs'];

    const partnerData = {
      name,
      category,
      title,
      phone,
      whatsapp,
      experience,
      visitingFee,
      address,
      image,
      specialties,
      description
    };

    if (this.editingServiceId) {
      this.storage.updateService(this.editingServiceId, partnerData);
      window.showToast(`Updated service partner ${name}`, "success");
    } else {
      this.storage.addService(partnerData);
      window.showToast(`Added new service partner ${name}!`, "success");
    }

    this.closeMerchantServiceModal();
    this.renderMerchantServices();
    this.renderDirectory();
  }

  escapeQuotes(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
}

// Global instance
window.servicesController = new ServicesController(window.storageService);

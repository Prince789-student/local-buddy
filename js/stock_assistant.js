/**
 * Local Buddy - Smart Stock IN & Stock OUT Assistant
 * Powered by Live Camera Barcode/QR Scanner, Web Speech Mic Recognition (English/Hindi/Hinglish),
 * and instant inventory synchronization with sound feedback & movement history.
 */

class StockAssistant {
  constructor(storageService, inventoryController, analyticsService) {
    this.storage = storageService;
    this.inventoryCtrl = inventoryController;
    this.analytics = analyticsService;

    this.currentMode = 'IN'; // 'IN' (Restock) or 'OUT' (Sale / Deduction)
    this.currentTab = 'scanner'; // 'scanner', 'voice', 'manual'
    this.autoConfirm = true;
    this.quantityDelta = 1;

    // Hardware states
    this.mediaStream = null;
    this.isScanning = false;
    this.barcodeDetector = null;
    this.lastScannedCode = null;
    this.lastScanTime = 0;

    // Voice recognition
    this.recognition = null;
    this.isListening = false;

    // Movement History
    this.movementHistory = [];

    // Audio context for beep sounds
    this.audioCtx = null;
  }

  init() {
    this.initBarcodeDetector();
    this.initSpeechRecognition();
    this.bindEvents();
  }

  initBarcodeDetector() {
    if ('BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix']
        });
      } catch (e) {
        console.warn("BarcodeDetector initialization note:", e);
      }
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Works seamlessly for Indian English and Hinglish phrases

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateVoiceUIState(true);
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        const transcriptEl = document.getElementById('voiceLiveTranscript');
        if (transcriptEl) {
          transcriptEl.textContent = `"${text}"`;
        }

        if (finalTranscript) {
          this.handleVoiceCommand(finalTranscript);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.isListening = false;
        this.updateVoiceUIState(false);
        const transcriptEl = document.getElementById('voiceLiveTranscript');
        if (transcriptEl) {
          transcriptEl.textContent = `Voice recognition notice: ${event.error}. Click mic to try again.`;
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateVoiceUIState(false);
      };
    }
  }

  bindEvents() {
    // Open Stock Station Trigger
    const openBtn = document.getElementById('openStockStationBtn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.openStation());
    }

    const quickScanBtn = document.getElementById('quickScanBtn');
    if (quickScanBtn) {
      quickScanBtn.addEventListener('click', () => {
        this.openStation('scanner');
      });
    }

    const quickVoiceBtn = document.getElementById('quickVoiceBtn');
    if (quickVoiceBtn) {
      quickVoiceBtn.addEventListener('click', () => {
        this.openStation('voice');
      });
    }

    // Modal Close buttons
    const closeBtn = document.getElementById('closeStockStationBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeStation());
    }

    // Mode Toggle (Stock IN vs Stock OUT)
    const modeInBtn = document.getElementById('stockModeInBtn');
    const modeOutBtn = document.getElementById('stockModeOutBtn');
    if (modeInBtn && modeOutBtn) {
      modeInBtn.addEventListener('click', () => this.setMode('IN'));
      modeOutBtn.addEventListener('click', () => this.setMode('OUT'));
    }

    // Tab Switcher (Scanner vs Voice vs Manual)
    const tabBtns = document.querySelectorAll('.stock-station-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Voice Mic Trigger Button
    const micBtn = document.getElementById('voiceMicTriggerBtn');
    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleVoiceListening());
    }

    // Manual Search & Barcode Input
    const manualInput = document.getElementById('stockManualSearchInput');
    if (manualInput) {
      manualInput.addEventListener('input', (e) => {
        this.searchAndPreviewProduct(e.target.value.trim());
      });
      manualInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeManualMatch();
        }
      });
    }

    // Quantity Presets & Steppers
    const qtyInput = document.getElementById('stockStationQtyInput');
    if (qtyInput) {
      qtyInput.addEventListener('change', (e) => {
        this.quantityDelta = Math.max(1, parseInt(e.target.value, 10) || 1);
      });
    }

    const presetBtns = document.querySelectorAll('.qty-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseInt(e.currentTarget.dataset.qty, 10) || 1;
        this.setQuantityDelta(val);
      });
    });

    // Auto-confirm toggle
    const autoConfirmToggle = document.getElementById('stockAutoConfirmToggle');
    if (autoConfirmToggle) {
      autoConfirmToggle.addEventListener('change', (e) => {
        this.autoConfirm = e.target.checked;
      });
    }

    // Undo button
    const undoBtn = document.getElementById('stockUndoLastBtn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undoLastMovement());
    }
  }

  openStation(initialTab = 'scanner') {
    const modal = document.getElementById('stockStationModal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.switchTab(initialTab);
    this.renderHistory();
  }

  closeStation() {
    const modal = document.getElementById('stockStationModal');
    if (modal) {
      modal.classList.remove('active');
    }
    document.body.style.overflow = '';
    this.stopScanner();
    this.stopVoiceListening();
  }

  setMode(mode) {
    this.currentMode = mode;
    const modeInBtn = document.getElementById('stockModeInBtn');
    const modeOutBtn = document.getElementById('stockModeOutBtn');
    const badge = document.getElementById('stockCurrentModeBadge');

    if (modeInBtn && modeOutBtn) {
      if (mode === 'IN') {
        modeInBtn.classList.add('active');
        modeOutBtn.classList.remove('active');
        if (badge) {
          badge.textContent = "📥 Stock IN (Restock)";
          badge.className = "stock-mode-pill in";
        }
      } else {
        modeOutBtn.classList.add('active');
        modeInBtn.classList.remove('active');
        if (badge) {
          badge.textContent = "📤 Stock OUT (Sales / Deduction)";
          badge.className = "stock-mode-pill out";
        }
      }
    }

    // Refresh preview card action button if active
    const confirmBtn = document.getElementById('stockConfirmActionBtn');
    if (confirmBtn) {
      confirmBtn.textContent = mode === 'IN' ? `Confirm Stock IN (+${this.quantityDelta})` : `Confirm Stock OUT (-${this.quantityDelta})`;
      confirmBtn.className = mode === 'IN' ? 'btn btn-success' : 'btn btn-danger';
    }
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.stock-station-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab panes
    document.querySelectorAll('.stock-station-pane').forEach(pane => {
      pane.classList.toggle('active', pane.dataset.pane === tab);
    });

    if (tab === 'scanner') {
      this.stopVoiceListening();
      this.startScanner();
    } else if (tab === 'voice') {
      this.stopScanner();
      // Reset live speech text
      const transcriptEl = document.getElementById('voiceLiveTranscript');
      if (transcriptEl) {
        transcriptEl.textContent = 'Tap the microphone and speak (e.g. "Add 10 Atta" or "Stock out 2 Dettol")...';
      }
    } else {
      this.stopScanner();
      this.stopVoiceListening();
      const manualInput = document.getElementById('stockManualSearchInput');
      if (manualInput) manualInput.focus();
    }
  }

  setQuantityDelta(val) {
    this.quantityDelta = Math.max(1, val);
    const qtyInput = document.getElementById('stockStationQtyInput');
    if (qtyInput) qtyInput.value = this.quantityDelta;

    document.querySelectorAll('.qty-preset-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.qty, 10) === this.quantityDelta);
    });

    // Update action button text
    const confirmBtn = document.getElementById('stockConfirmActionBtn');
    if (confirmBtn) {
      confirmBtn.textContent = this.currentMode === 'IN' 
        ? `Confirm Stock IN (+${this.quantityDelta})` 
        : `Confirm Stock OUT (-${this.quantityDelta})`;
    }
  }

  // =========================================================================
  // 📷 CAMERA BARCODE & QR SCANNER ENGINE
  // =========================================================================

  async startScanner() {
    const video = document.getElementById('stockScannerVideo');
    const statusEl = document.getElementById('scannerStatusText');
    if (!video) return;

    try {
      if (statusEl) statusEl.textContent = "Starting camera feed...";
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = this.mediaStream;
      await video.play();

      this.isScanning = true;
      if (statusEl) statusEl.textContent = "🟢 Camera live. Align barcode inside the targeting box.";
      this.scanVideoFrame();

    } catch (err) {
      console.warn("Camera access note:", err);
      if (statusEl) {
        statusEl.innerHTML = `⚠️ Camera unavailable (${err.name || 'Permission required'}). Use the <strong>Test Barcode SKUs</strong> below or the <strong>🎙️ Mic Voice tab</strong>.`;
      }
    }
  }

  stopScanner() {
    this.isScanning = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  async scanVideoFrame() {
    if (!this.isScanning) return;

    const video = document.getElementById('stockScannerVideo');
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && this.barcodeDetector) {
      try {
        const barcodes = await this.barcodeDetector.detect(video);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          const now = Date.now();

          // Debounce same barcode within 2 seconds
          if (rawValue !== this.lastScannedCode || now - this.lastScanTime > 2000) {
            this.lastScannedCode = rawValue;
            this.lastScanTime = now;
            this.handleScannedBarcode(rawValue);
          }
        }
      } catch (e) {
        // Continue detection loop
      }
    }

    if (this.isScanning) {
      requestAnimationFrame(() => this.scanVideoFrame());
    }
  }

  handleScannedBarcode(barcode) {
    this.playBeepSound(600, 0.1);
    this.matchAndProcessProduct(barcode, 'Scanner');
  }

  testScanSKU(sku) {
    this.playBeepSound(700, 0.1);
    this.matchAndProcessProduct(sku, 'Test Barcode');
  }

  // =========================================================================
  // 🎙️ VOICE SPEECH RECOGNITION & NLP PARSER
  // =========================================================================

  toggleVoiceListening() {
    if (this.isListening) {
      this.stopVoiceListening();
    } else {
      this.startVoiceListening();
    }
  }

  startVoiceListening() {
    if (!this.recognition) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome, Edge, or manual SKU search.");
      return;
    }

    try {
      this.recognition.start();
    } catch (e) {
      console.warn("Speech recognition restart note:", e);
    }
  }

  stopVoiceListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.updateVoiceUIState(false);
  }

  updateVoiceUIState(listening) {
    const micBtn = document.getElementById('voiceMicTriggerBtn');
    const waves = document.getElementById('voiceAudioWaves');
    const label = document.getElementById('voiceMicStatusLabel');

    if (micBtn) {
      micBtn.classList.toggle('listening', listening);
    }
    if (waves) {
      waves.style.display = listening ? 'flex' : 'none';
    }
    if (label) {
      label.textContent = listening ? "Listening... Speak your command now" : "Click to Speak Stock Command";
    }
  }

  handleVoiceCommand(transcript) {
    const text = transcript.toLowerCase().trim();
    console.log("Voice Command Detected:", text);

    // 1. Detect Action (Stock IN vs Stock OUT)
    let detectedMode = this.currentMode;
    const inKeywords = ['in', 'add', 'plus', 'restock', 'increase', 'dala', 'khareeda', 'aaya', 'laaya', 'badao', 'jama'];
    const outKeywords = ['out', 'deduct', 'sold', 'sell', 'remove', 'minus', 'decrease', 'nikala', 'becha', 'kam', 'ghatao', 'hatao'];

    // Check words in transcript
    const words = text.split(/\s+/);
    for (const w of words) {
      if (inKeywords.includes(w)) {
        detectedMode = 'IN';
        break;
      }
      if (outKeywords.includes(w)) {
        detectedMode = 'OUT';
        break;
      }
    }

    // 2. Extract Quantity
    let detectedQty = 1;
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20,
      'twenty five': 25, 'thirty': 30, 'fifty': 50, 'hundred': 100,
      'dozen': 12, 'darjan': 12,
      // Hindi numbers
      'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'chaar': 4, 'paanch': 5,
      'che': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'dus': 10,
      'gyarah': 11, 'barah': 12, 'pandra': 15, 'bees': 20, 'pachis': 25, 'pachaas': 50
    };

    // Check for digits first (e.g. "10", "5")
    const digitMatch = text.match(/\b\d+\b/);
    if (digitMatch) {
      detectedQty = parseInt(digitMatch[0], 10);
    } else {
      for (const [word, val] of Object.entries(numberWords)) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
          detectedQty = val;
          break;
        }
      }
    }

    // 3. Clean query for product name matching
    let cleanQuery = text;
    [...inKeywords, ...outKeywords, ...Object.keys(numberWords), 'packet', 'pack', 'kg', 'litre', 'bottle', 'piece', 'box', 'units', 'stock', 'please', 'the', 'of'].forEach(kw => {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${kw}\\b`, 'gi'), ' ');
    });
    cleanQuery = cleanQuery.replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanQuery) {
      cleanQuery = text;
    }

    // Set mode & quantity
    this.setMode(detectedMode);
    this.setQuantityDelta(detectedQty);

    // Match product
    const match = this.findBestProductMatch(cleanQuery);
    if (match) {
      this.displayMatchedPreview(match, 'Voice Command');
      if (this.autoConfirm) {
        this.executeStockChange(match, detectedMode, detectedQty, 'Voice');
        this.speakConfirmation(match.name, detectedMode, detectedQty);
      }
    } else {
      const statusEl = document.getElementById('voiceLiveTranscript');
      if (statusEl) {
        statusEl.innerHTML = `⚠️ Heard: "<em>${text}</em>" but could not match product "<strong>${cleanQuery}</strong>". Try speaking product name clearly.`;
      }
      this.playBeepSound(300, 0.2, 'sawtooth');
    }
  }

  speakConfirmation(productName, mode, qty) {
    if ('speechSynthesis' in window) {
      const actionWord = mode === 'IN' ? 'Stock in' : 'Stock out';
      const utterance = new SpeechSynthesisUtterance(`${actionWord} ${qty} units of ${productName}`);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  // =========================================================================
  // 🔍 PRODUCT MATCHING & STOCK EXECUTION
  // =========================================================================

  matchAndProcessProduct(query, source = 'Scanner') {
    const product = this.findBestProductMatch(query);
    if (product) {
      this.displayMatchedPreview(product, source);
      if (this.autoConfirm) {
        this.executeStockChange(product, this.currentMode, this.quantityDelta, source);
      }
    } else {
      this.showNoMatchNotice(query);
      this.playBeepSound(250, 0.25, 'sawtooth');
    }
  }

  findBestProductMatch(query) {
    if (!query) return null;
    const q = query.toLowerCase().trim();
    const items = this.storage.getInventory();

    // 1. Exact SKU match
    let match = items.find(i => (i.sku || '').toLowerCase() === q);
    if (match) return match;

    // 2. Exact ID match
    match = items.find(i => (i.id || '').toLowerCase() === q);
    if (match) return match;

    // 3. Exact Name match
    match = items.find(i => (i.name || '').toLowerCase() === q);
    if (match) return match;

    // 4. SKU contains or Name contains
    match = items.find(i => (i.sku || '').toLowerCase().includes(q) || (i.name || '').toLowerCase().includes(q));
    if (match) return match;

    // 5. Word token scoring
    const tokens = q.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length > 0) {
      let bestItem = null;
      let highestScore = 0;

      items.forEach(item => {
        const itemText = `${item.name} ${item.sku} ${item.category} ${item.description || ''}`.toLowerCase();
        let score = 0;
        tokens.forEach(tok => {
          if (itemText.includes(tok)) score++;
        });
        if (score > highestScore) {
          highestScore = score;
          bestItem = item;
        }
      });

      if (highestScore > 0) {
        return bestItem;
      }
    }

    return null;
  }

  displayMatchedPreview(product, source) {
    const previewBox = document.getElementById('stockMatchedPreviewBox');
    if (!previewBox) return;

    previewBox.style.display = 'block';
    
    const delta = this.currentMode === 'IN' ? this.quantityDelta : -this.quantityDelta;
    const newStock = Math.max(0, (parseInt(product.stock, 10) || 0) + delta);
    const modeClass = this.currentMode === 'IN' ? 'in' : 'out';

    previewBox.innerHTML = `
      <div class="stock-preview-card ${modeClass}">
        <div class="stock-preview-thumb">
          <img src="${product.image || 'assets/logo.jpg'}" alt="${product.name}">
        </div>
        <div class="stock-preview-info">
          <div style="display:flex; justify-content:space-between; align-items:flex-start">
            <span class="preview-sku">${product.sku || product.id}</span>
            <span class="preview-source-badge">${source}</span>
          </div>
          <h4>${product.name}</h4>
          <div class="stock-preview-metrics">
            <div class="metric-item">
              <span class="lbl">Current Stock:</span>
              <span class="val">${product.stock} ${product.unit || 'units'}</span>
            </div>
            <div class="metric-item highlight">
              <span class="lbl">Action:</span>
              <span class="val ${modeClass}">
                ${this.currentMode === 'IN' ? '+' : '-'}${this.quantityDelta} ${this.currentMode === 'IN' ? 'IN' : 'OUT'}
              </span>
            </div>
            <div class="metric-item">
              <span class="lbl">New Stock:</span>
              <span class="val" style="font-weight:800; color:var(--text-primary)">${newStock} ${product.unit || 'units'}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex; gap:0.75rem; margin-top:1rem; justify-content:flex-end">
        <button type="button" class="btn btn-secondary" onclick="stockAssistant.cancelPreview()">Cancel</button>
        <button type="button" id="stockConfirmActionBtn" class="btn ${this.currentMode === 'IN' ? 'btn-success' : 'btn-danger'}" onclick="stockAssistant.confirmCurrentPreview('${product.id}')">
          Confirm ${this.currentMode === 'IN' ? 'Stock IN (+' + this.quantityDelta + ')' : 'Stock OUT (-' + this.quantityDelta + ')'}
        </button>
      </div>
    `;

    // Scroll to preview if needed
    previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showNoMatchNotice(query) {
    const previewBox = document.getElementById('stockMatchedPreviewBox');
    if (!previewBox) return;

    previewBox.style.display = 'block';
    previewBox.innerHTML = `
      <div class="stock-preview-card" style="border-left-color:var(--danger); background:rgba(239,68,68,0.06)">
        <div style="padding:1rem; width:100%">
          <h4 style="color:var(--danger); margin-bottom:0.25rem;">⚠️ Product Not Found</h4>
          <p style="font-size:0.92rem; color:var(--text-secondary)">No inventory product matched SKU or barcode "<strong>${query}</strong>". Please verify the code or add it as a new product.</p>
        </div>
      </div>
    `;
  }

  cancelPreview() {
    const previewBox = document.getElementById('stockMatchedPreviewBox');
    if (previewBox) {
      previewBox.style.display = 'none';
      previewBox.innerHTML = '';
    }
  }

  confirmCurrentPreview(productId) {
    const items = this.storage.getInventory();
    const product = items.find(i => i.id === productId);
    if (product) {
      this.executeStockChange(product, this.currentMode, this.quantityDelta, 'Manual Confirm');
    }
  }

  executeStockChange(product, mode, qty, source) {
    const delta = mode === 'IN' ? qty : -qty;
    const oldStock = parseInt(product.stock, 10) || 0;
    const updatedProduct = this.storage.updateStock(product.id, delta);

    if (updatedProduct) {
      this.playSuccessChime();

      // Record in history
      const movement = {
        id: 'mov_' + Date.now(),
        productId: product.id,
        productName: product.name,
        sku: product.sku || product.id,
        mode: mode,
        qty: qty,
        delta: delta,
        previousStock: oldStock,
        newStock: updatedProduct.stock,
        source: source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      this.movementHistory.unshift(movement);
      if (this.movementHistory.length > 20) this.movementHistory.pop();

      // Update UI controllers
      if (this.inventoryCtrl) this.inventoryCtrl.render();
      if (this.analytics) this.analytics.updateKPIs();
      if (window.storefrontController) window.storefrontController.renderCatalog();

      // Toast notification
      const toastMsg = `${mode === 'IN' ? '📥 Restocked' : '📤 Dispatched'} ${qty}x ${product.name} (Stock: ${updatedProduct.stock})`;
      if (window.showToast) {
        window.showToast(toastMsg, mode === 'IN' ? 'success' : 'info');
      }

      // Re-render history log
      this.renderHistory();

      // Update preview card status
      const previewBox = document.getElementById('stockMatchedPreviewBox');
      if (previewBox) {
        previewBox.innerHTML = `
          <div class="stock-success-banner ${mode === 'IN' ? 'in' : 'out'}">
            <span>✅</span>
            <div>
              <strong>${mode === 'IN' ? 'Stock IN Successful' : 'Stock OUT Successful'}</strong>
              <div>Updated <em>${product.name}</em> stock to <strong>${updatedProduct.stock} ${product.unit || 'units'}</strong>.</div>
            </div>
          </div>
        `;
      }
    }
  }

  undoLastMovement() {
    if (this.movementHistory.length === 0) {
      if (window.showToast) window.showToast("No recent stock movements to undo", "warning");
      return;
    }

    const last = this.movementHistory.shift();
    const reverseDelta = -last.delta;
    const updated = this.storage.updateStock(last.productId, reverseDelta);

    if (updated) {
      if (this.inventoryCtrl) this.inventoryCtrl.render();
      if (this.analytics) this.analytics.updateKPIs();
      if (window.storefrontController) window.storefrontController.renderCatalog();

      this.renderHistory();
      if (window.showToast) {
        window.showToast(`Reverted: ${last.productName} stock restored to ${updated.stock}`, "info");
      }
    }
  }

  renderHistory() {
    const listEl = document.getElementById('stockRecentMovementsList');
    const emptyEl = document.getElementById('stockEmptyHistory');
    if (!listEl) return;

    if (this.movementHistory.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      listEl.innerHTML = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = this.movementHistory.map(m => `
      <div class="stock-history-item ${m.mode === 'IN' ? 'in' : 'out'}">
        <div class="history-left">
          <span class="history-badge ${m.mode === 'IN' ? 'in' : 'out'}">
            ${m.mode === 'IN' ? '+ ' + m.qty + ' IN' : '- ' + m.qty + ' OUT'}
          </span>
          <div class="history-details">
            <span class="history-name">${m.productName}</span>
            <span class="history-sub">${m.sku} • Stock: ${m.previousStock} → <strong>${m.newStock}</strong></span>
          </div>
        </div>
        <div class="history-right">
          <span class="history-source">${m.source}</span>
          <span class="history-time">${m.timestamp}</span>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 🔊 AUDIO FEEDBACK SYNTHESIS (Web Audio API)
  // =========================================================================

  playBeepSound(freq = 600, duration = 0.1, type = 'sine') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playSuccessChime() {
    this.playBeepSound(523.25, 0.08); // C5
    setTimeout(() => this.playBeepSound(659.25, 0.12), 80); // E5
  }
}

// Global initialization
window.StockAssistant = StockAssistant;

document.addEventListener('DOMContentLoaded', () => {
  window.stockAssistant = new StockAssistant(window.storageService, window.inventoryController, window.analyticsService);
  window.stockAssistant.init();
});

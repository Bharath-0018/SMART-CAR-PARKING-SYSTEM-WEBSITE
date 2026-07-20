// State Management for Parking Slots
let slots = [
  { id: 'A1', status: 'available', distance: 150, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car1.jpg' },
  { id: 'A2', status: 'available', distance: 162, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car2.jpg' },
  { id: 'A3', status: 'available', distance: 145, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car3.jpg' },
  { id: 'A4', status: 'available', distance: 155, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car1.jpg' },
  { id: 'B1', status: 'available', distance: 170, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car2.jpg' },
  { id: 'B2', status: 'available', distance: 158, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car3.jpg' },
  { id: 'B3', status: 'available', distance: 160, occupant: '', plate: '', duration: 0, occupiedAt: null, carImage: 'car1.jpg' },
  { id: 'B4', status: 'available', distance: 165, occupant: '', plate: '', duration: 0, occupiedAt: null, isEvSlot: true, evBatteryPct: 0, carImage: 'car2.jpg' },
];

let activeReserveSlotId = null;
let gateTimer = null;

// New innovations variables (Blockchain, Gamification, Drone battery)
const ownerNames = ["Sanjay Kumar", "Rohan Mehta", "Pooja Hegde", "Vijay Shankar", "Dinesh Karthik", "Nisha Sharma", "Kartik Iyer", "Ananya Rao", "Siddharth Nair", "Meera Sen"];
let droneBattery = 92;
let blockchainTx = [
  { block: 4489910, hash: '0x9b5fca8d30d12e5c8e8d8d6469616e6462726f74', method: 'Reserve NFT', status: 'CONFIRMED' },
  { block: 4489912, hash: '0x2a1c0d29d38c64ea9bdf54627725916f1a8de6a9', method: 'Settle Bill', status: 'CONFIRMED' }
];

// Peak Hours Traffic Mock Data (Hours 8 AM to 7 PM)
const trafficData = [
  { hour: '08 AM', val: 2 },
  { hour: '09 AM', val: 5 },
  { hour: '10 AM', val: 7 },
  { hour: '11 AM', val: 8 },
  { hour: '12 PM', val: 6 },
  { hour: '01 PM', val: 4 },
  { hour: '02 PM', val: 5 },
  { hour: '03 PM', val: 7 },
  { hour: '04 PM', val: 8 },
  { hour: '05 PM', val: 6 },
  { hour: '06 PM', val: 4 },
  { hour: '07 PM', val: 3 }
];

// SVG Car Icon XML
const carSvg = `
<svg class="car-icon" viewBox="0 0 24 24">
  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5zM7.5 13c-.83 0-1.5.67-1.5 1.5S6.67 16 7.5 16s1.5-.67 1.5-1.5S8.33 13 7.5 13zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
</svg>`;

// Initialize Webpage Controls
document.addEventListener('DOMContentLoaded', () => {
  // Sync slot state from localStorage if it exists
  const savedSlots = localStorage.getItem('smart_parking_slots');
  if (savedSlots) {
    slots = JSON.parse(savedSlots);
  }

  // Load blockchain logs from localStorage
  const savedBlockchain = localStorage.getItem('smart_blockchain_logs');
  if (savedBlockchain) {
    blockchainTx = JSON.parse(savedBlockchain);
  } else {
    localStorage.setItem('smart_blockchain_logs', JSON.stringify(blockchainTx));
  }

  // Load and display Daily Audit Report metrics
  const rev = localStorage.getItem('daily_revenue') || '1440';
  const count = localStorage.getItem('audited_cars') || '12';
  const revEl = document.getElementById('report-revenue');
  const countEl = document.getElementById('report-count');
  if (revEl) revEl.textContent = '₹' + rev;
  if (countEl) countEl.textContent = count + ' Cars';

  initSerialLogs();
  renderGrid();
  renderSliders();
  renderTrafficChart();
  updateMetrics();
  setupEventListeners();
  initEnvironmentalControls();
  renderBlockchainLogs();

  // Apply Owner Login state on page load
  applyOwnerSessionState();

  // Check for external booking events from booking.html
  const bookEvent = localStorage.getItem('new_booking_event');
  if (bookEvent) {
    setTimeout(() => {
      addLog(bookEvent, 'info');
      // Sync list
      renderActiveSessions();
      updateMetrics();
    }, 800);
    localStorage.removeItem('new_booking_event');
  }

  // Poll for external gate swiping actions from gate.html
  setInterval(() => {
    const swipeEvent = localStorage.getItem('rfid_gate_swipe_event');
    if (swipeEvent) {
      addLog(swipeEvent, 'warn');
      addLog('[SYSTEM] Gate open sequence initiated. Vacating occupied slots.', 'info');
      
      // Vacate a random occupied slot if swiped to simulate leaving
      const occupied = slots.filter(s => s.status === 'occupied');
      if (occupied.length > 0) {
        const target = occupied[Math.floor(Math.random() * occupied.length)];
        processPaidCallback(target.id, '120');
      } else {
        addLog('[SYSTEM] Access logs swipe cleared. 0 active occupied slots found.', 'info');
      }
      localStorage.removeItem('rfid_gate_swipe_event');
    }
  }, 1200);

  // Process payment return callback query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paidSlotId = urlParams.get('paidSlot');
  if (paidSlotId) {
    const cost = urlParams.get('cost') || '120';
    setTimeout(() => {
      processPaidCallback(paidSlotId, cost);
    }, 600);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Active Billing Tracker Render Loop
  renderActiveSessions();
  setInterval(renderActiveSessions, 1000);

  // IST Ticker Clock
  function updateISTClock() {
    const clockEl = document.getElementById('ist-clock');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = 'IST: ' + now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  updateISTClock();
  setInterval(updateISTClock, 1000);

  // Start background ambient activity simulation
  startAmbientIoTActivity();
});

// 1. Render Parking Grid
function renderGrid() {
  const gridContainer = document.getElementById('parking-grid');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';

  slots.forEach(slot => {
    const slotEl = document.createElement('div');
    const displayStatus = (slot.status === 'occupied') ? 'occupied' : 'available';
    slotEl.className = `parking-slot ${displayStatus}`;
    slotEl.dataset.id = slot.id;
    
    // Status text label mapping: occupied is FILLED, vacant is VACANT
    let statusLabel = (slot.status === 'occupied') ? 'FILLED' : 'VACANT';

    let evBadge = '';
    let evStatusMarkup = '';
    if (slot.isEvSlot) {
      evBadge = `<div class="ev-charging-badge" title="Smart EV Fast Charging Point"><svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg></div>`;
      if (slot.status === 'occupied') {
        const chargingTxt = slot.evBatteryPct === 100 ? 'Charged' : `Charging: ${slot.evBatteryPct}%`;
        evStatusMarkup = `<div class="ev-status-text" id="ev-pct-${slot.id}">${chargingTxt}</div>`;
      }
    }

    slotEl.innerHTML = `
      <span class="slot-id">${slot.id}</span>
      ${evBadge}
      <div class="slot-visual">
        ${carSvg}
      </div>
      <div class="slot-sensor-reading">Sensor: <span id="dist-txt-${slot.id}">${slot.distance}</span>cm</div>
      ${evStatusMarkup}
      <span class="slot-status-label" style="font-weight: 800; font-family: var(--font-mono);">${statusLabel}</span>
      <span class="slot-action">Telemetry Panel</span>
    `;

    // Click handler disabled for bookings - forces navigation
    slotEl.addEventListener('click', () => {
      if (slot.status === 'occupied') {
        alert(`Slot ${slot.id} is physically FILLED by vehicle ${slot.plate}. Checkout is managed under the "Active Sessions" tracker in the right panel.`);
      } else if (slot.status === 'reserved') {
        alert(`Slot ${slot.id} is reserved for ${slot.occupant} but is currently physically VACANT. Active reservation buffers are ticking.`);
      } else {
        alert(`Slot ${slot.id} is physically VACANT. To book reservations, please click on the "Book Slot" link in the navigation header.`);
      }
    });

    gridContainer.appendChild(slotEl);
  });
  
  // Render blueprint map changes
  updateBlueprintMap();
}

// 2. Render Distance Sliders
function renderSliders() {
  const slidersContainer = document.getElementById('sensor-sliders-group');
  slidersContainer.innerHTML = '';

  slots.forEach(slot => {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    controlGroup.innerHTML = `
      <div class="control-label">
        <span>Ultrasonic Slot ${slot.id}</span>
        <span class="badge">GPIO D${slot.id === 'A1' ? 0 : slot.id === 'A2' ? 1 : slot.id === 'A3' ? 2 : 5}</span>
      </div>
      <div class="sensor-slider-container">
        <div class="sensor-slider-row">
          <label>Car</label>
          <input type="range" class="sensor-slider" min="2" max="200" value="${slot.distance}" data-id="${slot.id}">
          <span class="sensor-val-display" id="slider-val-${slot.id}">${slot.distance} cm</span>
        </div>
      </div>
    `;

    // Slider inputs updating slot distance state
    const slider = controlGroup.querySelector('.sensor-slider');
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      updateSlotDistance(slot.id, val, 'USER_SLIDER');
    });

    slidersContainer.appendChild(controlGroup);
  });
}

// 3. Update Slot State from Sensor Distance
function updateSlotDistance(slotId, val, source = 'USER_SLIDER') {
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  const oldStatus = slot.status;
  slot.distance = val;

  // Real-time sensor logic: distance below 20cm means space is physically blocked/occupied
  if (val < 20) {
    if (slot.status !== 'occupied') {
      const wasReserved = slot.status === 'reserved';
      slot.status = 'occupied';
      slot.occupiedAt = new Date();
      slot.reservedAt = null; // clear reservation buffer
      // Generate mock plate/occupant if empty
      if (!slot.plate) {
        slot.occupant = ownerNames[Math.floor(Math.random() * ownerNames.length)];
        slot.plate = generateRandomPlate();
        slot.carImage = 'car' + (Math.floor(Math.random() * 3) + 1) + '.jpg';
      }
      addLog(`[ULTRASONIC] Sensor ${slot.id} reads ${val}cm (object detected). State: OCCUPIED`, 'warn');
      if (wasReserved) {
        addLog(`[SYSTEM] Reserved vehicle checked in successfully on Slot ${slot.id}.`, 'info');
      }
      sendHardwareResponse(slot.id, 'OCCUPIED');
    }
  } else {
    // If it was occupied, it is now vacant
    if (slot.status === 'occupied') {
      slot.status = 'available';
      slot.occupant = '';
      slot.plate = '';
      slot.occupiedAt = null;
      addLog(`[ULTRASONIC] Sensor ${slot.id} reads ${val}cm (cleared). State: VACANT`, 'info');
      sendHardwareResponse(slot.id, 'VACANT');
    }
  }

  // Update visual layouts
  document.getElementById(`slider-val-${slotId}`).textContent = `${val} cm`;
  const slider = document.querySelector(`.sensor-slider[data-id="${slotId}"]`);
  if (slider) slider.value = val;

  // Refresh visual elements without full re-render to keep slider smooth
  const slotCard = document.querySelector(`.parking-slot[data-id="${slotId}"]`);
  if (slotCard) {
    slotCard.className = `parking-slot ${slot.status}`;
    const txtReading = slotCard.querySelector(`#dist-txt-${slotId}`);
    if (txtReading) txtReading.textContent = val;
    
    let statusLabel = 'Available';
    if (slot.status === 'occupied') statusLabel = 'Occupied';
    if (slot.status === 'reserved') statusLabel = 'Reserved';
    
    const labelSpan = slotCard.querySelector('.slot-status-label');
    if (labelSpan) {
      labelSpan.textContent = statusLabel;
    }
  }

  updateMetrics();
  localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
}

// 4. Send Mock HTTP/MQTT updates back to ESP8266
function sendHardwareResponse(slotId, status) {
  const telemetry = `POST /api/slots HTTP/1.1\r\nHost: 192.168.1.100\r\nConnection: close\r\nContent-Type: application/json\r\n\r\n{"slot":"${slotId}","status":"${status}"}`;
  addLog(`[ESP8266] TX Telemetry: "${slotId}" is ${status}`, 'esp-tx');
}

// 4. Render live metrics and Rupees conversions
function updateMetrics() {
  const availableEl = document.getElementById('val-available');
  const occupiedEl = document.getElementById('val-occupied');
  const reservedEl = document.getElementById('val-reserved');
  const rateEl = document.getElementById('val-occupancy-rate');

  if (!availableEl || !occupiedEl || !reservedEl || !rateEl) return;

  const total = slots.length;
  const available = slots.filter(s => s.status === 'available').length;
  const occupied = slots.filter(s => s.status === 'occupied').length;
  const reserved = slots.filter(s => s.status === 'reserved').length;

  availableEl.textContent = available;
  occupiedEl.textContent = occupied;
  reservedEl.textContent = reserved;

  const rate = Math.round(((occupied + reserved) / total) * 100);
  rateEl.textContent = `${rate}%`;
}

// 6. Draw Hourly Traffic Chart
function renderTrafficChart() {
  const chart = document.getElementById('hourly-traffic-chart');
  chart.innerHTML = '';

  trafficData.forEach(d => {
    const barPercent = (d.val / 8) * 100;
    const barWrapper = document.createElement('div');
    barWrapper.className = 'chart-bar-wrapper';
    
    barWrapper.innerHTML = `
      <div class="chart-bar" style="height: ${barPercent}%; --height: ${barPercent}%" data-val="${d.val} cars"></div>
      <span class="chart-bar-label">${d.hour}</span>
    `;
    chart.appendChild(barWrapper);
  });
}

// 7. Setup Event Listeners
function setupEventListeners() {
  // Clear Serial monitor terminal
  const clearConsoleBtn = document.getElementById('clear-console-btn');
  if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener('click', () => {
      const logsContainer = document.getElementById('console-logs');
      if (logsContainer) logsContainer.innerHTML = '';
      addLog('[SYSTEM] Console buffer cleared by administrator.', 'info');
    });
  }

  // RFID scan simulation button
  const btnScanRfid = document.getElementById('btn-scan-rfid');
  if (btnScanRfid) {
    btnScanRfid.addEventListener('click', () => {
      const input = document.getElementById('rfid-card-input');
      let uid = input.value.trim().toUpperCase();
      if (!uid) {
        uid = generateRandomRFID();
        input.value = uid;
      }
      simulateRFIDSwipe(uid);
    });
  }

  // Tap Card simulation clicking on RFID Graphic
  const rfidSensor = document.getElementById('rfid-sensor');
  if (rfidSensor) {
    rfidSensor.addEventListener('click', () => {
      const uid = generateRandomRFID();
      const input = document.getElementById('rfid-card-input');
      if (input) input.value = uid;
      simulateRFIDSwipe(uid);
    });
  }

  // Tab switching documentation
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.docs-content').forEach(c => c.classList.remove('active'));
      
      const tabId = e.target.getAttribute('data-tab');
      e.target.classList.add('active');
      const targetTab = document.getElementById(tabId);
      if (targetTab) targetTab.classList.add('active');
    });
  });

  // Reservation Modal Controls
  const cancelBtn = document.getElementById('btn-cancel-reserve');
  if (cancelBtn) cancelBtn.addEventListener('click', closeReserveModal);
  
  const confirmBtn = document.getElementById('btn-confirm-reserve');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmReservation);

  // Deploy Drone Button
  const deployDroneBtn = document.getElementById('btn-deploy-drone');
  if (deployDroneBtn) {
    deployDroneBtn.addEventListener('click', launchDroneSimulation);
  }
}

// 8. RFID Scan simulation Logic
function simulateRFIDSwipe(cardUid) {
  const rfidSensor = document.getElementById('rfid-sensor');
  const ledGreen = document.getElementById('led-green');
  const ledRed = document.getElementById('led-red');
  const gateArm = document.getElementById('gate-arm');
  const gateStatusLabel = document.getElementById('gate-status-label');
  const gateAngleDisp = document.getElementById('gate-angle-display');

  if (rfidSensor) rfidSensor.classList.add('scanning');
  addLog(`[RFID] RFID card UID scanned: ${cardUid}`, 'info');

  setTimeout(() => {
    if (rfidSensor) rfidSensor.classList.remove('scanning');
    
    // Check access authorization
    const authorized = Math.random() > 0.15; // 85% chance of authorized card

    if (authorized) {
      addLog(`[ACCESS] CARD ${cardUid} AUTHORIZED. Welcome Akshay!`, 'info');
      addLog(`[SERVO] Opening Entry barrier servo...`, 'esp');
      
      // Update LED indicators
      if (ledRed) ledRed.classList.remove('active');
      if (ledGreen) ledGreen.classList.add('active');
      
      // Animate Gate Arm opening
      if (gateArm) gateArm.classList.add('open');
      if (gateStatusLabel) {
        gateStatusLabel.textContent = 'OPEN';
        gateStatusLabel.className = 'gate-status-text open';
      }
      if (gateAngleDisp) gateAngleDisp.textContent = 'Gate Servo: 90°';

      // Lock down gate after delay
      if (gateTimer) clearTimeout(gateTimer);
      gateTimer = setTimeout(() => {
        addLog(`[SERVO] Closing Entry barrier servo (Timeout)...`, 'esp');
        if (ledGreen) ledGreen.classList.remove('active');
        if (ledRed) ledRed.classList.add('active');
        if (gateArm) gateArm.classList.remove('open');
        if (gateStatusLabel) {
          gateStatusLabel.textContent = 'CLOSED';
          gateStatusLabel.className = 'gate-status-text';
        }
        if (gateAngleDisp) gateAngleDisp.textContent = 'Gate Servo: 0°';
        addLog(`[SYSTEM] Security barrier locked.`, 'info');
      }, 4500);

    } else {
      addLog(`[ACCESS] ACCESS DENIED: Card UID ${cardUid} not registered!`, 'error');
      // Red LED flash
      if (ledRed) {
        ledRed.classList.add('active');
        setTimeout(() => ledRed.classList.remove('active'), 200);
        setTimeout(() => ledRed.classList.add('active'), 400);
        setTimeout(() => ledRed.classList.remove('active'), 600);
        setTimeout(() => ledRed.classList.add('active'), 800);
      }
    }
  }, 400);
}

// Helper to generate a random 8-char hex RFID string
function generateRandomRFID() {
  const chars = '0123456789ABCDEF';
  let uid = '';
  for (let i = 0; i < 4; i++) {
    uid += chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)] + ' ';
  }
  return uid.trim();
}

// 9. Serial Console Logger Utilities
function addLog(msg, type = 'info') {
  const consoleEl = document.getElementById('console-logs');
  if (!consoleEl) return;

  const now = new Date();
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;

  const logLine = document.createElement('div');
  logLine.className = 'log-line';
  
  let typeClass = 'log-info';
  if (type === 'warn') typeClass = 'log-warn';
  if (type === 'error') typeClass = 'log-error';
  if (type === 'esp') typeClass = 'log-esp';
  if (type === 'esp-tx') typeClass = 'esp-tx';

  logLine.innerHTML = `<span class="log-time">[${timestamp}]</span><span class="${typeClass}">${msg}</span>`;
  consoleEl.appendChild(logLine);
  
  // Keep terminal focused at bottom
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Boot setup serial entries
function initSerialLogs() {
  addLog('[SYSTEM] Booting Smart Car Parking System Controller (NodeMCU ESP8266)...', 'esp');
  setTimeout(() => addLog('[WiFi] Initializing connection settings...', 'esp'), 200);
  setTimeout(() => addLog('[WiFi] Searching SSID "Akshay_IoT_Net"...', 'esp'), 500);
  setTimeout(() => addLog('[WiFi] Connected to "Akshay_IoT_Net" - Signal: -58dBm', 'esp'), 1200);
  setTimeout(() => addLog('[WiFi] Static IP binding successful: 192.168.1.45', 'esp'), 1500);
  setTimeout(() => addLog('[RFID] MFRC522 card reader synced (SPI frequency: 4.0MHz).', 'info'), 1800);
  setTimeout(() => addLog('[SERVO] Gate SG90 Servo attached to GPIO Pin 2. Calibrated to 0°.', 'info'), 2100);
  setTimeout(() => addLog('[SYSTEM] Base calibration: Sensors A1-B4 initialized successfully.', 'info'), 2400);
  setTimeout(() => addLog('[SYSTEM] Dashboard synchronization established. Awaiting sensor inputs.', 'info'), 2600);
}

// 10. Booking Modals & Manual Reservations
function openReserveModal(slotId) {
  activeReserveSlotId = slotId;
  document.getElementById('modal-slot-id').textContent = slotId;
  document.getElementById('reserve-name').value = '';
  document.getElementById('reserve-plate').value = '';
  document.getElementById('reserve-modal').classList.add('active');
}

function closeReserveModal() {
  document.getElementById('reserve-modal').classList.remove('active');
  activeReserveSlotId = null;
}

function confirmReservation() {
  const nameInput = document.getElementById('reserve-name').value.trim();
  const plateInput = document.getElementById('reserve-plate').value.trim();
  const duration = parseInt(document.getElementById('reserve-duration').value) || 2;

  if (!nameInput || !plateInput) {
    alert('Please fill out all booking fields to lock in your reservation.');
    return;
  }

  const slot = slots.find(s => s.id === activeReserveSlotId);
  if (slot && slot.status === 'available') {
    slot.status = 'reserved';
    slot.occupant = nameInput;
    slot.plate = plateInput;
    slot.duration = duration;

    addLog(`[RESERVATION] Slot ${slot.id} reserved for ${nameInput} (Plate: ${plateInput}) for ${duration} hours`, 'info');
    
    // Trigger slot re-render
    renderGrid();
    closeReserveModal();
    updateMetrics();
  }
}

// Cancel reservation by clicking on Reserved Spot
function releaseReservedSlot(slotId) {
  const slot = slots.find(s => s.id === slotId);
  if (slot && slot.status === 'reserved') {
    const release = confirm(`Slot ${slotId} is currently reserved for ${slot.occupant}. Release this reservation?`);
    if (release) {
      slot.status = 'available';
      slot.occupant = '';
      slot.plate = '';
      slot.duration = 0;
      
      addLog(`[RESERVATION] Reservation on Slot ${slotId} released. Spot is now open.`, 'info');
      renderGrid();
      updateMetrics();
    }
  }
}

// 11. Ambient Event Loop Simulator
function startAmbientIoTActivity() {
  setInterval(() => {
    // 1. Chance to update a slot's ultrasonic sensor reading randomly
    const randomSlot = slots[Math.floor(Math.random() * slots.length)];
    
    // Ignore reserved slots for distance-triggered state updates, or let car pull into reserved spot
    if (randomSlot.status === 'reserved') {
      // Simulate physical car pulling into reserved slot
      if (Math.random() > 0.7) {
        randomSlot.status = 'occupied';
        randomSlot.distance = Math.floor(Math.random() * 8) + 4; // 4 to 12cm
        randomSlot.occupiedAt = new Date();
        randomSlot.reservedAt = null;
        addLog(`[ULTRASONIC] Car has parked in RESERVED Slot ${randomSlot.id}. Sensor reads ${randomSlot.distance}cm.`, 'warn');
        renderGrid();
        updateMetrics();
        localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
      }
      return;
    }

    const currentDist = randomSlot.distance;
    let newDist;

    if (randomSlot.status === 'occupied') {
      // 15% chance car leaves
      if (Math.random() > 0.85) {
        newDist = Math.floor(Math.random() * 50) + 140; // 140 to 190 cm
        updateSlotDistance(randomSlot.id, newDist, 'AMBIENT');
      } else {
        // Subtle drift in ultrasonic telemetry reading
        newDist = currentDist + (Math.random() > 0.5 ? 1 : -1);
        if (newDist < 2) newDist = 2;
        if (newDist >= 20) newDist = 19; // force stay occupied
        updateSlotDistance(randomSlot.id, newDist, 'AMBIENT');
      }
    } else {
      // Vacant: 10% chance a car pulls in
      if (Math.random() > 0.90) {
        newDist = Math.floor(Math.random() * 10) + 5; // 5 to 15 cm
        updateSlotDistance(randomSlot.id, newDist, 'AMBIENT');
      } else {
        // Vacant drift
        newDist = currentDist + Math.floor(Math.random() * 7) - 3;
        if (newDist > 200) newDist = 200;
        if (newDist < 20) newDist = 21; // force stay vacant
        updateSlotDistance(randomSlot.id, newDist, 'AMBIENT');
      }
    }
  }, 12000); // Trigger ambient changes every 12 seconds

  // 2. Simulate random RFID access swipe at entry barrier occasionally (every 32 seconds)
  setInterval(() => {
    if (Math.random() > 0.6) {
      const randomCard = generateRandomRFID();
      addLog(`[SYSTEM] Gateway RFID Scanner detected nearby card transponder.`, 'esp');
      simulateRFIDSwipe(randomCard);
    }
  }, 32000);
}

// 12. Copy Code snippet helper
function copySnippet() {
  const codeText = document.getElementById('arduino-code-pre').innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    const copyBtn = document.querySelector('.code-copy-btn');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy code snippet: ', err);
  });
}

// 13. Environmental Control Innovations
let gasPpm = 120;
let luxLevel = 650;
let batteryPct = 85;

function initEnvironmentalControls() {
  const gasSlider = document.getElementById('gas-slider');
  const gasValDisp = document.getElementById('gas-val-display');
  const ldrSlider = document.getElementById('ldr-slider');
  const ldrValDisp = document.getElementById('ldr-val-display');
  const alarmLabel = document.getElementById('alarm-status-label');
  const fanIcon = document.getElementById('fan-icon-container');
  const fanTxt = document.getElementById('fan-status-txt');
  const lightLed = document.getElementById('streetlight-led');
  const lightTxt = document.getElementById('streetlight-status-txt');
  const batteryFill = document.getElementById('battery-fill');
  const batteryTxt = document.getElementById('battery-pct-txt');

  // MQ-2 Gas Slider Listener
  gasSlider.addEventListener('input', (e) => {
    gasPpm = parseInt(e.target.value);
    gasValDisp.textContent = `${gasPpm} PPM`;
    
    if (gasPpm > 250) {
      alarmLabel.textContent = 'ALARM ACTIVE';
      alarmLabel.className = 'alarm-status-badge warning';
      
      fanIcon.classList.add('spinning');
      fanTxt.textContent = 'MAX RPM';
      fanTxt.style.color = 'var(--status-occupied)';
      
      if (Math.random() > 0.8) {
        addLog(`[SAFETY_ALARM] MQ-2 Smoke sensor triggers: ${gasPpm} PPM! Activating Exhaust Fan at MAX RPM.`, 'error');
      }
    } else {
      alarmLabel.textContent = 'SYSTEM SAFE';
      alarmLabel.className = 'alarm-status-badge safe';
      
      fanIcon.classList.remove('spinning');
      fanTxt.textContent = 'STANDBY';
      fanTxt.style.color = 'var(--text-muted)';
    }
  });

  // LDR Light Slider Listener
  ldrSlider.addEventListener('input', (e) => {
    luxLevel = parseInt(e.target.value);
    ldrValDisp.textContent = `${luxLevel} Lux`;
    
    if (luxLevel < 200) {
      lightLed.classList.add('active');
      lightTxt.textContent = 'ON';
      lightTxt.style.color = '#FFF066';
      
      if (Math.random() > 0.8) {
        addLog(`[LDR] Ambient Light drops: ${luxLevel} Lux. Turning Smart Streetlights ON.`, 'info');
      }
    } else {
      lightLed.classList.remove('active');
      lightTxt.textContent = 'OFF';
      lightTxt.style.color = 'var(--text-muted)';
    }
  });

  // Solar Battery Energy Simulation loop (Every 6 seconds)
  setInterval(() => {
    if (luxLevel > 500) {
      if (batteryPct < 100) {
        batteryPct += 1;
        if (batteryPct > 100) batteryPct = 100;
      }
    } else {
      if (batteryPct > 20) {
        const drain = (luxLevel < 200 ? 1 : 0) + (gasPpm > 250 ? 1 : 0) + 1;
        batteryPct -= drain;
        if (batteryPct < 20) batteryPct = 20;
        
        if (batteryPct <= 30 && Math.random() > 0.8) {
          addLog(`[SOLAR_GRID] WARNING: Solar Battery Critically Low (${batteryPct}%). Charging required.`, 'warn');
        }
      }
    }
    
    batteryFill.style.width = `${batteryPct}%`;
    batteryTxt.textContent = `${batteryPct}%`;
    
    if (batteryPct <= 30) {
      batteryFill.style.backgroundColor = 'var(--status-occupied)';
    } else {
      batteryFill.style.backgroundColor = 'var(--status-available)';
    }
  }, 6000);
}

// 14. EV Charging Station Simulator loop (Every 4 seconds)
setInterval(() => {
  const evSlot = slots.find(s => s.isEvSlot);
  if (evSlot && evSlot.status === 'occupied') {
    if (evSlot.evBatteryPct < 100) {
      if (evSlot.evBatteryPct === 0) {
        evSlot.evBatteryPct = 20;
        addLog(`[EV_CHARGER] Vehicle connected on EV Slot ${evSlot.id}. Initial charge: 20%. Initiating Smart Fast Charge...`, 'info');
      }
      
      evSlot.evBatteryPct += Math.floor(Math.random() * 6) + 4; // add 4-9 percent
      if (evSlot.evBatteryPct >= 100) {
        evSlot.evBatteryPct = 100;
        addLog(`[EV_CHARGER] Vehicle on EV Slot ${evSlot.id} is fully charged (100%).`, 'info');
      } else {
        if (Math.random() > 0.5) {
          addLog(`[EV_CHARGER] Power delivery on Slot ${evSlot.id}: 22.4 kW. Battery level: ${evSlot.evBatteryPct}%`, 'esp');
        }
      }
      
      const pctDisp = document.getElementById(`ev-pct-${evSlot.id}`);
      if (pctDisp) {
        pctDisp.textContent = evSlot.evBatteryPct === 100 ? 'Charged' : `Charging: ${evSlot.evBatteryPct}%`;
      } else {
        renderGrid();
      }
    }
  } else if (evSlot && evSlot.status !== 'occupied' && evSlot.evBatteryPct > 0) {
    evSlot.evBatteryPct = 0;
  }
}, 4000);

// 15. Active Session Tracker UI Render
function renderActiveSessions() {
  const container = document.getElementById('active-sessions-list');
  if (!container) return;

  const activeSlots = slots.filter(s => s.status === 'occupied' || s.status === 'reserved');
  
  if (activeSlots.length === 0) {
    container.innerHTML = `<div class="session-item-empty">No active parking sessions.</div>`;
    return;
  }

  container.innerHTML = '';
  activeSlots.forEach(slot => {
    // 1. Reserved Slot: check for No-Show buffer countdown timer (10 mins buffer)
    if (slot.status === 'reserved') {
      const reservedAt = slot.reservedAt || new Date().getTime();
      const parsedReserved = reservedAt ? new Date(reservedAt) : new Date();
      const reservedTimeMs = (!isNaN(parsedReserved.getTime())) ? parsedReserved.getTime() : new Date().getTime();
      const elapsedSec = Math.floor((new Date().getTime() - reservedTimeMs) / 1000);
      const bufferSecondsLeft = 600 - elapsedSec;
      
      if (bufferSecondsLeft <= 0) {
        // Exceeded buffer! Settle a ₹10 fine and release the slot.
        const prevOccupant = slot.occupant || 'Visitor';
        slot.status = 'available';
        slot.occupant = '';
        slot.plate = '';
        slot.duration = 0;
        slot.distance = 150;
        slot.reservedAt = null;
        
        let dailyRev = parseInt(localStorage.getItem('daily_revenue') || '1440');
        dailyRev += 10;
        localStorage.setItem('daily_revenue', dailyRev);
        
        // Save slots back
        localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
        
        const revEl = document.getElementById('report-revenue');
        if (revEl) revEl.textContent = '₹' + dailyRev;
        
        addLog(`[NO_SHOW_PENALTY] Owner ${prevOccupant} failed to check in on Slot ${slot.id} within 10m buffer. Charged ₹10 penalty. Spot released.`, 'error');
        
        renderGrid();
        return;
      }
      
      const bufferMinPart = Math.max(0, Math.floor(bufferSecondsLeft / 60));
      const bufferSecPart = Math.max(0, bufferSecondsLeft % 60);
      const bufferDisplayStr = `${bufferMinPart}m ${bufferSecPart}s left`;
      
      const evText = slot.isEvSlot ? '<span class="ev-badge">EV</span>' : '';
      const item = document.createElement('div');
      item.className = 'session-item reserved';
      item.innerHTML = `
        <div class="session-info">
          <span class="session-slot-tag" style="background:var(--status-reserved); color:#000; font-weight:700;">Slot ${slot.id} ${evText} [RESERVED]</span>
          <span style="font-size: 0.72rem; color: var(--accent-primary); font-weight: bold; display: block; margin: 3px 0 1px 0;">Owner: ${slot.occupant || 'Visitor'}</span>
          <span class="session-plate-num">${slot.plate || 'No Plate Registered'}</span>
          <span class="session-time-info" style="color:var(--status-reserved); font-weight:bold;">⚠️ NO-SHOW BUFFER: ${bufferDisplayStr}</span>
        </div>
        <div class="session-billing-info">
          <span class="session-cost">₹10 Fine</span>
          <button class="btn btn-pay" onclick="cancelBookingFine('${slot.id}')" style="padding: 4px 8px; font-size: 0.65rem; font-family: var(--font-main); background:var(--status-occupied); border-color:var(--status-occupied);">Cancel & Pay ₹10</button>
        </div>
      `;
      container.appendChild(item);
      return;
    }

    // 2. Occupied Slot: standard billing tracker
    let elapsedMinutes = 0;
    const parsedOcc = slot.occupiedAt ? new Date(slot.occupiedAt) : null;
    if (parsedOcc && !isNaN(parsedOcc.getTime())) {
      elapsedMinutes = Math.max(1, Math.floor((new Date().getTime() - parsedOcc.getTime()) / 60000));
    } else {
      elapsedMinutes = 15;
    }
    
    const reservedMinutes = slot.duration || 30;
    let cost = 0;
    let overtimeStatusText = '';
    
    if (elapsedMinutes <= reservedMinutes) {
      cost = elapsedMinutes * 2.00;
    } else {
      const overtimeMinutes = elapsedMinutes - reservedMinutes;
      cost = (reservedMinutes * 2.00) + (overtimeMinutes * 2.50);
      overtimeStatusText = `<span style="color:var(--status-occupied); font-size:0.6rem; font-weight:bold; display:block;">OVERTIME: ${overtimeMinutes} mins</span>`;
    }
    
    const finalCost = cost.toFixed(0);
    const evText = slot.isEvSlot ? '<span class="ev-badge">EV</span>' : '';
    
    const item = document.createElement('div');
    item.className = 'session-item';
    
    item.innerHTML = `
      <div class="session-info">
        <span class="session-slot-tag">Slot ${slot.id} ${evText}</span>
        <span style="font-size: 0.72rem; color: var(--accent-primary); font-weight: bold; display: block; margin: 3px 0 1px 0;">Owner: ${slot.occupant || 'Visitor'}</span>
        <span class="session-plate-num">${slot.plate || 'No Plate Registered'}</span>
        <span class="session-time-info">Duration: ${elapsedMinutes} mins (Booked: ${reservedMinutes}m)</span>
        ${overtimeStatusText}
      </div>
      <div class="session-billing-info">
        <span class="session-cost">₹${finalCost}</span>
        <button class="btn btn-pay" onclick="redirectToCheckout('${slot.id}', '${slot.plate || ''}', ${slot.occupiedAt ? slot.occupiedAt.getTime() : new Date().getTime()})" style="padding: 4px 8px; font-size: 0.65rem; font-family: var(--font-main);">Pay & Exit</button>
      </div>
    `;
    
    container.appendChild(item);
  });
}

function redirectToCheckout(slotId, plate, timestamp) {
  const slot = slots.find(s => s.id === slotId);
  if (slot) {
    if (!slot.carImage) {
      slot.carImage = 'car' + (Math.floor(Math.random() * 3) + 1) + '.jpg';
    }
    const tempTx = '0x' + Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
    
    // Save current slots state to localStorage
    localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
    
    const ownerName = slot.occupant || 'Visitor';
    const phone = slot.phone || 'No Phone';
    const reservedMinutes = slot.duration || 30; // duration is stored as minutes
    window.location.href = `payment.html?slot=${slotId}&plate=${encodeURIComponent(plate)}&time=${timestamp}&owner=${encodeURIComponent(ownerName)}&phone=${encodeURIComponent(phone)}&carImage=${slot.carImage}&txHash=${tempTx}&reservedMinutes=${reservedMinutes}`;
  }
}

function processPaidCallback(slotId, cost) {
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  const urlParams = new URLSearchParams(window.location.search);
  const callbackHash = urlParams.get('txHash') || ('0x' + Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join(''));
  
  // Register block confirmations on decentralized ledger
  const lastBlockVal = (blockchainTx && blockchainTx.length > 0) ? blockchainTx[blockchainTx.length - 1].block : 4489912;
  const nextBlock = lastBlockVal + Math.floor(Math.random() * 3) + 1;
  blockchainTx.push({
    block: nextBlock,
    hash: callbackHash,
    method: 'Settle Bill',
    status: 'CONFIRMED'
  });
  renderBlockchainLogs();
  
  // Save ledger logs to local storage
  localStorage.setItem('smart_blockchain_logs', JSON.stringify(blockchainTx));

  // Cumulative revenue tracking
  let dailyRev = parseInt(localStorage.getItem('daily_revenue') || '1440');
  dailyRev += parseInt(cost);
  localStorage.setItem('daily_revenue', dailyRev);
  
  let dailyCount = parseInt(localStorage.getItem('audited_cars') || '12');
  dailyCount += 1;
  localStorage.setItem('audited_cars', dailyCount);

  // Update desk metrics
  const revEl = document.getElementById('report-revenue');
  const countEl = document.getElementById('report-count');
  if (revEl) revEl.textContent = '₹' + dailyRev;
  if (countEl) countEl.textContent = dailyCount + ' Cars';

  // Gamification rewards point updates: EV slots double tokens!
  let pointsEarned = slot.isEvSlot ? 100 : 50;
  let rewardValSpan = document.getElementById('rewards-token-bal');
  if (rewardValSpan) {
    let currentBal = parseInt(rewardValSpan.textContent) || 540;
    currentBal += pointsEarned;
    rewardValSpan.textContent = currentBal + ' PKT';
  }

  addLog(`[BLOCKCHAIN] Tx ${callbackHash.substring(0,10)}... confirmed on Block #${nextBlock}. NFT Receipt minted.`, 'info');
  addLog(`[REWARDS] Loyalty rewards credited +${pointsEarned} PKT to member Akshay K. (New Bal: ${parseInt(rewardValSpan?.textContent) || 540} PKT)`, 'info');

  addLog(`[PAYMENT] Received web checkout confirmation for Slot ${slot.id}. Amount: ₹${cost}`, 'info');
  addLog(`[SYSTEM] Gateway transaction verified. Release exit gate barrier pin D4.`, 'info');
  
  // Open gate elements (only if present on page)
  const ledGreen = document.getElementById('led-green');
  const ledRed = document.getElementById('led-red');
  const gateArm = document.getElementById('gate-arm');
  const gateStatusLabel = document.getElementById('gate-status-label');
  const gateAngleDisp = document.getElementById('gate-angle-display');
  
  if (ledGreen && ledRed && gateArm && gateStatusLabel && gateAngleDisp) {
    ledRed.classList.remove('active');
    ledGreen.classList.add('active');
    gateArm.classList.add('open');
    gateStatusLabel.textContent = 'OPEN';
    gateStatusLabel.className = 'gate-status-text open';
    gateAngleDisp.textContent = 'Gate Servo: 90°';

    // Close gate servo after delay
    setTimeout(() => {
      ledGreen.classList.remove('active');
      ledRed.classList.add('active');
      gateArm.classList.remove('open');
      gateStatusLabel.textContent = 'CLOSED';
      gateStatusLabel.className = 'gate-status-text';
      gateAngleDisp.textContent = 'Gate Servo: 0°';
      addLog(`[SYSTEM] Exit barrier closed. Security locked.`, 'info');
    }, 4500);
  }

  // Vacate slot
  slot.status = 'available';
  slot.occupant = '';
  slot.plate = '';
  slot.distance = 150; // reset physical distance to empty
  slot.occupiedAt = null;
  slot.evBatteryPct = 0;

  // Sync inputs
  const slider = document.querySelector(`.sensor-slider[data-id="${slot.id}"]`);
  if (slider) slider.value = 150;
  const sliderVal = document.getElementById(`slider-val-${slot.id}`);
  if (sliderVal) sliderVal.textContent = '150 cm';

  addLog(`[ULTRASONIC] Sensor ${slot.id} reads 150cm (vacated). State: VACANT`, 'info');
  sendHardwareResponse(slot.id, 'VACANT');

  // Redraw
  renderGrid();
  renderActiveSessions();
  updateMetrics();
  
  localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
}

// Update Top Down blueprint map colors in real-time
function updateBlueprintMap() {
  slots.forEach(slot => {
    const mapEl = document.getElementById(`map-slot-${slot.id}`);
    if (!mapEl) return;
    
    if (slot.status === 'occupied') {
      mapEl.style.borderColor = 'var(--status-occupied)';
      mapEl.style.backgroundColor = 'rgba(255, 23, 68, 0.1)';
      mapEl.style.boxShadow = '0 0 10px rgba(255, 23, 68, 0.15)';
    } else if (slot.status === 'reserved') {
      mapEl.style.borderColor = 'var(--status-reserved)';
      mapEl.style.backgroundColor = 'rgba(255, 214, 0, 0.1)';
      mapEl.style.boxShadow = '0 0 10px rgba(255, 214, 0, 0.15)';
    } else {
      mapEl.style.borderColor = 'var(--status-available)';
      mapEl.style.backgroundColor = 'rgba(0, 230, 118, 0.03)';
      mapEl.style.boxShadow = 'none';
    }
  });
}

// Downloadable Audit report for Akshay Krishna, Bharath, Hari Haran
function downloadDailyReport() {
  const rev = localStorage.getItem('daily_revenue') || '1440';
  const count = localStorage.getItem('audited_cars') || '12';
  const timestamp = new Date().toLocaleString();

  const reportText = `=====================================================
SMART CAR PARKING SYSTEM - DAILY OPERATIONS AUDIT REPORT
=====================================================
Generated On: ${timestamp}
Project Leads: Akshay Krishna, Bharath, Hari Haran
Location Code: PKG-BLR-04

[FINANCIAL METRICS]
-----------------------------------------------------
- Total Revenue Collected Today: INR ₹${rev}
- Average Tariff / Hour: ₹120
- EV Fast Charger Billing Share: ₹770.40 (64.2 kWh)

[TRAFFIC ANALYSIS]
-----------------------------------------------------
- Total Vehicles Checked Out: ${count} Cars
- Peak Occupancy Period: 11:00 AM - 04:00 PM
- Sensor Calibration Status: 100% ONLINE (10/10 nodes)
- Drone Patrol Sorties Conducted: 4 flights

[BLOCKCHAIN LEDGER SPECIFICATIONS]
-----------------------------------------------------
- Smart Contract Ticket Protocol: ERC-721 NFT
- Ledger Net: Polygon Mainnet
- Mint Validation Index: TXN-NFT-9988A

Thank you,
Smart Parking Audit Bot
=====================================================`;

  const blob = new Blob([reportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `smart_parking_daily_report_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Render Web3 transaction ledger logs
function renderBlockchainLogs() {
  const listEl = document.getElementById('blockchain-tx-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  blockchainTx.slice().reverse().forEach(tx => {
    const line = document.createElement('div');
    line.style.cssText = "display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.03);";
    
    const shortHash = tx.hash.substring(0, 8) + '...' + tx.hash.substring(tx.hash.length - 6);
    
    line.innerHTML = `
      <span>Block #${tx.block}</span>
      <span style="color:#a272ff; cursor:pointer;" title="${tx.hash}">${shortHash}</span>
      <span style="color:var(--text-muted); font-size:0.6rem;">${tx.method}</span>
      <span style="color:var(--status-available); font-weight:bold;">${tx.status}</span>
    `;
    listEl.appendChild(line);
  });
  listEl.scrollTop = 0;
}

// Owner Accounts & Authentication logic
const ownerAccounts = [
  { id: "akshay_krishna", pass: "akshay123", name: "Akshay Krishna" },
  { id: "hari_haran", pass: "hari123", name: "Hari Haran" },
  { id: "bharath", pass: "bharath123", name: "Bharath" }
];

window.authenticateOwner = function() {
  const userVal = document.getElementById('owner-username').value.trim();
  const passVal = document.getElementById('owner-password').value.trim();
  const errorEl = document.getElementById('login-error-msg');
  
  const account = ownerAccounts.find(acc => acc.id === userVal && acc.pass === passVal);
  if (account) {
    sessionStorage.setItem('owner_logged_in', 'true');
    sessionStorage.setItem('logged_owner_name', account.name);
    applyOwnerSessionState();
    if (errorEl) errorEl.style.display = 'none';
    addLog(`[SECURITY] Owner authenticated: ${account.name}. Desk metrics unlocked.`, 'info');
  } else {
    if (errorEl) errorEl.style.display = 'block';
    addLog(`[SECURITY] Authentication failed. Invalid login ID or password.`, 'error');
  }
};

window.logoutOwner = function() {
  sessionStorage.removeItem('owner_logged_in');
  sessionStorage.removeItem('logged_owner_name');
  applyOwnerSessionState();
  addLog(`[SECURITY] Owner session terminated. Desk reports locked.`, 'info');
};

function applyOwnerSessionState() {
  const loginBlock = document.getElementById('owner-login-block');
  const reportBlock = document.getElementById('owner-report-block');
  const cardStatus = document.getElementById('owner-card-status');
  const activeName = document.getElementById('active-logged-owner');
  
  const isLoggedIn = sessionStorage.getItem('owner_logged_in') === 'true';
  const loggedName = sessionStorage.getItem('logged_owner_name') || '';

  if (isLoggedIn) {
    if (loginBlock) loginBlock.style.display = 'none';
    if (reportBlock) reportBlock.style.display = 'block';
    if (cardStatus) {
      cardStatus.textContent = 'UNLOCKED';
      cardStatus.style.color = 'var(--status-available)';
    }
    if (activeName) activeName.textContent = loggedName;
  } else {
    if (loginBlock) loginBlock.style.display = 'flex';
    if (reportBlock) reportBlock.style.display = 'none';
    if (cardStatus) {
      cardStatus.textContent = 'SECURE LOCK';
      cardStatus.style.color = 'var(--accent-secondary)';
    }
    // Clear inputs
    const userField = document.getElementById('owner-username');
    const passField = document.getElementById('owner-password');
    if (userField) userField.value = '';
    if (passField) passField.value = '';
  }
}

function generateRandomPlate() {
  const states = ['KA', 'MH', 'DL', 'KL', 'TN', 'AP'];
  const state = states[Math.floor(Math.random() * states.length)];
  const code = String(Math.floor(Math.random() * 19) + 1).padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const char = chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)];
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `${state}-${code}-${char}-${num}`;
}

// Built-in Automated Interactive Simulator Demo Tour
window.runAutomatedDemo = function() {
  const startBtn = document.getElementById('btn-start-demo');
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
  }
  
  // Create floating overlay message
  let demoTip = document.getElementById('demo-overlay-tip');
  if (!demoTip) {
    demoTip = document.createElement('div');
    demoTip.id = 'demo-overlay-tip';
    demoTip.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(2, 9, 15, 0.95); border:2px solid var(--accent-primary); border-radius:10px; padding:15px 25px; color:#fff; z-index:10000; font-family:var(--font-main); font-size:0.9rem; box-shadow:0 0 25px rgba(0,245,212,0.45); font-weight:700; transition:all 0.5s; text-align:center; max-width:85%; line-height:1.5;";
    document.body.appendChild(demoTip);
  }
  demoTip.style.display = 'block';

  const setTip = (txt) => {
    demoTip.innerHTML = `🤖 <strong>LIVE SIMULATOR TOUR:</strong> ${txt}`;
  };

  // Step 1: Login
  setTip("Initializing automated simulation. Scrolling to Owner's Desk to authenticate...");
  const ownerCard = document.getElementById('owner-username');
  if (ownerCard) ownerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(() => {
    setTip("Entering credentials for Manager: <strong>Bharath</strong>...");
    const uField = document.getElementById('owner-username');
    const pField = document.getElementById('owner-password');
    if (uField) uField.value = 'bharath';
    if (pField) pField.value = 'bharath123';
  }, 2500);

  setTimeout(() => {
    setTip("Submitting credentials and unlocking audited ledgers...");
    authenticateOwner();
  }, 5000);

  // Step 2: Book slot
  setTimeout(() => {
    setTip("Access granted. Scrolling to live parking bay grid layout...");
    const grid = document.getElementById('parking-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 7500);

  setTimeout(() => {
    setTip("Simulating reservation for **Slot A3** via booking API (Tariff: ₹2.00/min)...");
    const target = slots.find(s => s.id === 'A3');
    if (target) {
      target.status = 'reserved';
      target.occupant = 'Bharath (Demo)';
      target.plate = 'KA-01-MJ-9988';
      target.duration = 45; // 45 minutes
      localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
      addLog(`[RESERVATION] Demo booking reserved Slot A3 for Bharath. NFT Ticket minted.`, 'info');
      renderGrid();
      updateMetrics();
    }
  }, 10500);

  // Step 3: Check-in occupied
  setTimeout(() => {
    setTip("Car pulled into Reserved Bay A3. Triggering distance telemetry at 6cm...");
    const slider = document.querySelector(`.sensor-slider[data-id="A3"]`);
    if (slider) {
      slider.value = 6;
      updateSlotDistance('A3', 6, 'USER_SLIDER');
    }
  }, 14500);

  // Step 4: Show active billing
  setTimeout(() => {
    setTip("Parking session active. Standard billing starts in real-time...");
    const list = document.getElementById('active-sessions-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 18000);

  // Step 5: Checkout payment trigger
  setTimeout(() => {
    setTip("Simulating check-out payment return callback for A3 (Amount: ₹90)...");
  }, 21500);

  setTimeout(() => {
    setTip("Settled ₹90 bill. Minting Web3 Receipt NFT and clearing slot status...");
    processPaidCallback('A3', '90');
  }, 24500);

  setTimeout(() => {
    setTip("Tour complete! Slot A3 is vacant. Redirecting you to CCTV Facilities...");
  }, 28000);

  setTimeout(() => {
    // Hide tip and redirect
    demoTip.style.display = 'none';
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
    }
    window.location.href = 'facilities.html';
  }, 30500);
};

window.cancelBookingFine = function(slotId) {
  const slot = slots.find(s => s.id === slotId);
  if (slot && slot.status === 'reserved') {
    const prevOccupant = slot.occupant || 'Visitor';
    slot.status = 'available';
    slot.occupant = '';
    slot.plate = '';
    slot.duration = 0;
    slot.distance = 150;
    slot.reservedAt = null;
    
    let dailyRev = parseInt(localStorage.getItem('daily_revenue') || '1440');
    dailyRev += 10;
    localStorage.setItem('daily_revenue', dailyRev);
    
    // Save slots back
    localStorage.setItem('smart_parking_slots', JSON.stringify(slots));
    
    const revEl = document.getElementById('report-revenue');
    if (revEl) revEl.textContent = '₹' + dailyRev;
    
    addLog(`[NO_SHOW_PENALTY] Booking on Slot ${slotId} cancelled early. Charged ₹10 penalty.`, 'warn');
    renderGrid();
    renderActiveSessions();
    updateMetrics();
  }
};

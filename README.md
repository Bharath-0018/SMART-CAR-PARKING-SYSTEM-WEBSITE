# IoT Smart Car Parking System Dashboard

An advanced, multi-portal web visualizer and billing engine designed to interface with physical IoT parking slot nodes. Outfitted with decentralized Web3 ledgers, LDR streetlights, gas alarms, and automatic RFID servo barrier gate controllers.

Developed by project engineers: **Akshay Krishna**, **Bharath**, and **Hari Haran**.

---

## 🎨 Theme & Typography Design System
- **Palette**: Deep Obsidian Canvas (`#02090F`), Glowing Cyan (`#00F5D4`), and Sunset Purple (`#a272ff`) glassmorphic UI components.
- **Typography**: Google Fonts **Outfit** (headings/titles) and **Space Grotesk** (monitored stats/grids) for a premium, high-tech interface.

---

## 🚀 Key Features & Innovations

### 1. Built-In Live Simulator Demo Tour
- Pressing the floating **Start Live Simulator Tour** button triggers an automated step-by-step presentation.
- It automatically scrolls the page, simulates typing owner credentials, unlocks the dashboard, locks a booking on Slot A3, pulls the vehicle in by moving the sensor slider, calculates tariffs, processes checkout, and redirects you to the CCTV surveillance suite!

### 2. Owners Desk Authentication Portal
Access to the **Daily Operations Report (Owner's Desk)** is restricted by default. To unlock the financial and audit metrics, log in using one of the three verified developer accounts:
1. **Akshay Krishna**: ID `akshay_krishna`, Password `akshay123`
2. **Hari Haran**: ID `hari_haran`, Password `hari123`
3. **Bharath**: ID `bharath`, Password `bharath123`

### 3. Minutes-Based Booking & Overtime Surcharges
- Standard Booking rate is set to **₹2.00 per minute** (e.g., ₹60 for a 30-minute block).
- If actual parking duration (1 real second = 1 parking minute) exceeds the booked reservation block, the system automatically levies a premium **₹2.50 per minute** overtime surcharge.
- Calculations follow this pricing model:
  $$\text{Total Cost} = (\text{Booked Minutes} \times 2.00) + (\text{Overtime Minutes} \times 2.50)$$

### 4. Interactive Top-Down Blueprint Map
- A top-down layout blueprint shows the architectural footprint of the parking slots, driveway lanes, restrooms, and customer cafes.
- Updates card status colors in real time matching grid sensor telemetry: **Green** (Vacant), **Amber** (Reserved), and **Red** (Occupied).

### 5. CCTV Deployment Fallback Grids
- Designed for high-availability deployment. If the static vehicle photo files are missing or take too long to fetch during hosting, the camera card immediately transitions to render a premium animated vector wireframe stream of the parking layout instead of displaying a broken file link.

### 6. Multi-Tab Cross-Page Gate Synchronization
- Swiping a card in `gate.html` sends a lock-free callback to `localStorage`.
- The main dashboard polls this event: it automatically logs the exit swipe on the console logs terminal, vacates a random slot, credits ParkTokens, and updates stats immediately!

---

## 📂 Project Architecture

All files are located in your workspace directory:

- **[index.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/index.html)**: The primary operations deck. Features the Live Grid visualizer, IoT environmental sensors, Web3 Polygon ticketing ledger, and the Daily Operations report widget.
- **[booking.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/booking.html)**: Dedicated slot reservation page. Shows slot availability indicators, owner forms, and total tariff calculations in minutes at **₹2/minute**.
- **[gate.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/gate.html)**: Barrier gate control center. Features interactive SG90 servo slider controllers (0° to 90°), RFID card swiper, and logging databases.
- **[hardware.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/hardware.html)**: Component integration manual. Outlines GPIO pin configuration tables, circuit descriptions, and Arduino C++ embedded files.
- **[payment.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/payment.html)**: Stands as the checkout terminal. Processes card/UPI payments in Rupees (₹) and handles JPEG image canvas downloads.
- **[facilities.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/facilities.html)**: CCTV camera feeds and specification specs for onsite EV fast-charging.
- **[style.css](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/style.css)**: Master stylesheet defining the Obsidian Teal design tokens, animations, variables, layouts, and print overrides.
- **[app.js](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/app.js)**: Dashboard event loop controller managing sensor telemetry sliders, on-screen console logging, chart rendering, and transaction callbacks.

---

## 🛠️ How to Deploy & Test

1. **Launch the Dashboard**: Open **[index.html](file:///C:/Users/VSB%20CSE-2/.gemini/antigravity/scratch/smart-parking-dashboard/index.html)** in any web browser.
2. **Start Demo Mode**: Simply press **Start Live Simulator Tour** (floating button in the bottom-left corner). The dashboard will automatically scroll and run through the entire operational flow (authentication, reservation, parking detection, billing calculation, and payment checkout) on your screen before redirecting to the facilities panel!
3. **Manual Booking**: Alternatively, click **Book Slot** in the navigation bar to reserve A2 for **30 Minutes**.
4. **Park the Vehicle**: On returning to the dashboard, drag the **Ultrasonic Slot A2** slider below **20 cm** to simulate parking.
5. **Checkout**: Click **Pay & Exit**, verify the invoice, download your JPEG invoice slip, and press **Complete Checkout**. The slot will vacate automatically!

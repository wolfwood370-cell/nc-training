# NC Performance Hub - Elite UI/UX Design System
**Version:** 1.0
**Target:** Athlete Mobile Application (PWA)
**Vibe:** Premium Private Clinic, Elite Coaching, Apple Health / Oura Ring precision.

## 1. CORE PRINCIPLES
- **Strictly Light Mode:** To convey clinical precision and cleanliness.
- **Widget-Based Architecture:** Move away from infinite scrolling lists. Essential daily data MUST fit "above the fold" on standard mobile screens.
- **Frictionless Input:** Zero sliders, zero native dropdowns. Use tactile, large touch targets (min 48px) with haptic feedback.
- **Cognitive Load Reduction:** One chart = one question. Do not stack excessive variables on single visual elements.

## 2. DESIGN TOKENS

### 2.1 Color Palette (Strict Hex Codes)
- **Backgrounds & Surface Cards:** `#FFFFFF` (Pure White) - *Used for app background and widget cards (with subtle drop shadow).*
- **Primary Text & Main Headings:** `#043555` (Deep Navy) - *Conveys authority and trust.*
- **Secondary Text, Icons, Subtitles & Axes:** `#50768E` (Muted Blue) - *Used for unselected states and contextual data.*
- **Primary Buttons, Active States & Chart Lines:** `#226FA3` (Vibrant Blue) - *The single primary action color. Draws the eye immediately.*
- **Dark Accent / Deep UI:** `#093858` - *Used for heavy borders or fixed bottom navigation backgrounds if high contrast is needed.*

### 2.2 Typography
- **Headings & Titles:** `Manrope` (Geometric, premium feel).
- **Body, Numbers & Labels:** `Inter` (Maximum legibility for high-density data).

---

## 3. PAGE ARCHITECTURES

### 3.1 Home Dashboard (`AthleteDashboard.tsx`)
A 3-widget vertical stack, zero scrolling required.

1. **Readiness Widget (Top):**
   - Right: Circular gauge with total score (e.g., 82).
   - Left: Top 3 subjective sub-metrics stacked vertically (e.g., Sleep, Energy, Soreness).
2. **Today's Training Widget (Middle):**
   - Action-driven card. Title ("W1: Lower Body Power") and a massive `#226FA3` "Start Session" button. No exercise lists.
3. **Metabolic & Nutrition Widget (Bottom):**
   - Strict 50/50 split grid.
   - Right Column: 3 Apple-style Concentric Rings (Pro, Fat, Carb). Center text: Remaining Calories (e.g., "- 350 kcal" in `#043555`).
   - Left Column (Top): Clean text readout of macros (e.g., Pro: 120g, Fat: 45g).
   - Left Column (Bottom): Horizontal row of 3 mini-rings (F, W, S) for Fiber, Water, Sodium. Fill-based, no numbers.

### 3.2 Readiness Analysis Detail (`ReadinessDetail.tsx`)
Scrollable deep-dive view accessible by tapping the Readiness Widget.

1. **Hero Section:** Large total score + full-width "Log Today's Readiness" button.
2. **Daily Breakdown ("Today's Factors"):**
   - 6 horizontal progress bars: Sleep, Energy, Soreness, Stress, Mood, Digestion. Fill color: `#226FA3`, Track: `#F1F5F9`.
   - **INTERACTIVITY:** A filter icon allows selecting a specific metric (e.g., "Soreness") to isolate the trend. Active selection highlights the specific row.
3. **Historical Trend ("7-Day Trend"):**
   - Smooth Spline Line Chart (Color: `#226FA3`).
   - **DYNAMIC LOGIC:** If a specific metric is selected in the breakdown above, this chart updates to plot ONLY that metric's 7-day history.

### 3.3 Readiness Logger Modal (`ReadinessLoggerDrawer.tsx`)
Bottom sheet modal for daily check-ins. Must take < 10 seconds.

1. **Core Biofeedback:** 5 horizontal rows (Sleep, Energy, Stress, Mood, Digestion).
   - Input: 5 distinct circular segmented buttons (Scores 1-5) per row. Unselected: `#F1F5F9`, Selected: `#226FA3`.
2. **Localized Soreness:**
   - Tag Cloud of pill-shaped buttons for 11 muscle groups.
   - Interaction: Tapping a muscle (e.g., "Quads") toggles it to Active (`#226FA3`) and reveals an inline 3-level intensity selector (Mild, Moderate, Severe).
3. **Haptics:** Trigger `navigator.vibrate(50)` on every single button tap to simulate physical switches.

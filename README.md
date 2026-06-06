# 🧠 MindWave: Your AI-Powered Life OS

A self-hosted, private **"digital brain"** that organizes your entire life. MindWave combines intelligent AI chat, habit tracking, smart goal planning, journaling, focus tools, and a financial OS into a single, cohesive operating system for your daily routine — fully optimized for both desktop and mobile.

---

## 🌟 Key Features

### 🤖 Intelligent AI Assistant
- **Granular Model Selection** — toggle between **Llama 3.3 70B** (Smartest), **DeepSeek R1 70B** (Reasoning), **Llama 3 70B** (Fast), or **Gemma 2 9B** directly from the chat interface. Preferences are saved to your profile.
- **Multimodal Vision AI** — upload images including **Strava activity screenshots** for performance analysis. The backend automatically switches to **Llama 4 Scout** (`meta-llama/llama-4-scout-17b-16e-instruct`) — Groq's latest multimodal vision model — to analyze your data visually.
- **True Vector RAG (Document Intelligence)** — upload PDFs, TXT, or JSON files. The local Node.js server automatically chunks documents, generates 384-dimensional mathematical embeddings using `@xenova/transformers` (`all-MiniLM-L6-v2`), and retrieves relevant context using cosine similarity.
- **Interactive Tool Execution** — control your Life OS via chat. Say *"I drank water"* or *"Add a running habit"* and the AI updates your tracker automatically. It can also create full structured goal plans.
- **Voice Interface (STT & TTS)** — Tap the microphone icon for **Speech-to-Text** dictation. Toggle the speaker icon for **Text-to-Speech** responses with natural voice synthesis.

### 🎯 Smart Goal Tracking
- **AI Goal Plan Creator** — describe a goal (e.g., *"I want to run a marathon in 3 months"*); the AI generates a full structured plan with category, target date, and 5–7 specific milestones.
- **Dynamic Milestone Timeline** — a beautiful visual timeline with numbered steps, due date countdowns (*"2d overdue"*), and spine connector lines.
- **Activity Logging** — click any step to open an activity modal, log what you did, and mark the step complete.
- **Calendar View** — a unified monthly grid showing all milestone due dates, color-coded by category.
- **Animated Progress Rings** — high-quality circular progress indicators on every goal card and dashboard summary.
- **Collaborative Goal Sharing** — invite teammates via email; all collaborators can update milestones and log activities in real-time.

### 📅 Advanced Habit Tracker
- **Streak & Consistency Tracking** — monitor daily progress with current/best streaks and weekly calendar heatmaps.
- **AI Habit Insights** — ask for a performance report; the AI analyzes your data to provide qualitative feedback and actionable weekly challenges.
- **Table View by Default** — the habit tracker defaults to a scrollable table with sticky habit names, showing the last 7 days at a glance on desktop.
- **Premium Mobile Cards** — mobile users automatically receive a highly optimized native-app experience with touch-friendly cards featuring 7-day mini-heatmaps and glowing completion effects.

### ✍️ Intelligent Journaling
- **Sentiment & Topic Analysis** — instant AI analysis on every entry that identifies your mood, key topics, and provides wellbeing suggestions.
- **Privacy-First Storage** — all journals are stored securely in your MongoDB instance, never used for training external models.

### 💰 Financial OS (Expense Tracker)
- **Bento Grid Dashboard** — a world-class financial command center featuring modular cards for balance tracking, spending analytics, and category distribution.
- **Smart Categorization** — dynamic, type-aware selection logic that filters categories based on Income vs. Expense; includes full localized **INR (₹)** support.
- **Threshold Monitoring** — set monthly budget limits per category with real-time progress tracking and "safe vs. over-limit" visual alerts.
- **Spending Analytics** — high-fidelity weekly and monthly trends visualization with adaptive bar charts and category distribution donut charts.
- **Data Portability** — export your full transaction history to **CSV** for secondary analysis.

### 🧘 Focus & Zen
- **Pomodoro-style Timer** — built-in countdown with quick-select presets (5m, 15m, 25m, 50m) and custom hour/minute/second picker to help you stay in flow state.
- **Smart Ambient Soundscapes** — curated royalty-free audio tracks that automatically play when the timer starts and pause when it stops.
- **Custom Native Notifications** — procedural chimes and beeps are generated directly using the browser's native **Web Audio API** for session completion alerts.
- **Mobile-Safe Completion Alerts** — timer completion uses `ServiceWorkerRegistration.showNotification()` on Android combined with custom audio chimes.

### 🔔 Proactive Systems
- **Smart Notification Bell** — real-time alerts for overdue milestones, habits at risk of losing streaks, and daily reminders.
- **Global Semantic Search** — one search bar to find anything across goals, habits, and journals. Includes **vector-search** for content *inside* your uploaded PDFs.

### 📊 Personalized Productivity & Quick Actions
- **Interactive Productivity Targets** — set your own daily/weekly goals (0–100%) via a high-performance range slider on the dashboard.
- **Horizontal Quick Action Slider** — a touch-optimized scrolling strip for mobile that provides one-tap access to your most-used tools.
- **Dynamic 7-Day Activity Chart** — a glow-accented bar chart visualizing habit completion rates with live status indicators and historical averages.

### 📱 Mobile Experience
- **Compact 8-Item Bottom Navigation** — all core modules accessible via a scrollable bottom nav bar with spring-animated active indicators.
- **Centered Modal System** — all modals (Goals, Activity Log, Delete Confirm, AI Chat) use a clean centered scale-in animation on all screen sizes.
- **Safe Area Inset Support** — proper padding for iPhone notches, Dynamic Island, and home indicator bars using `env(safe-area-inset-*)`.
- **Dynamic View Height** — modals and full-screen layouts use `dvh` units to correctly account for collapsible browser address bars on iOS/Android.
- **Responsive Dashboard** — 2-column card grid on mobile expanding to 4-column on large screens.
- **iOS Input Zoom Prevention** — all inputs set to `font-size: 16px` on mobile to prevent Safari's auto-zoom behavior.

### 🛡️ Security & Privacy
- **Self-Hosted** — you own your data, stored in your own MongoDB instance.
- **Data Portability** — Export everything (Journals, Habits, Goals, Chat) as **JSON** or **CSV** with a visual date-range slider.
- **Privacy Controls** — "Danger Zone" in settings to permanently wipe all data and account.
- **Security Hardened** — Helmet, rate-limiting, XSS sanitization, and NoSQL injection prevention.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v3, Framer Motion, Lucide Icons |
| **Charts** | Recharts (Bento-style analytics) |
| **State / Routing** | React Context, React Router v7, React Query (TanStack) |
| **PWA** | Vite PWA Plugin, Web App Manifest, Service Worker |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB via Mongoose 9 |
| **AI Engine** | Groq SDK (Llama 3.3 70B, DeepSeek R1 70B, **Llama 4 Scout** Vision) |
| **Vector RAG** | `@xenova/transformers` (Local Node.js embeddings), Cosine Similarity |
| **Auth** | Custom JWT + Bcrypt + Nodemailer (for password resets) |
| **Security** | Helmet, express-rate-limit, HPP, custom XSS & Mongo sanitizers |

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** v18+
2. **MongoDB** instance (Local or Atlas)
3. **Groq API Key** — [console.groq.com](https://console.groq.com)
4. **Gmail App Password** (Optional) — for password resets

### Installation

```bash
# 1. Clone & Enter
git clone https://github.com/sanjaikumarkaleeswaran/Mindwave.git
cd Mindwave

# 2. Server setup
cd server && npm install
cp .env.example .env # fill in your keys

# 3. Client setup
cd ../client && npm install
npm run build # for production mode
```

### Running Locally

**One click (Windows):** Double-click `start_app.bat`.

**Manual:**
- Terminal 1 (Backend): `cd server && npm start`
- Terminal 2 (Frontend): `cd client && npm run dev`

---

## 📂 Project Structure

```
Mindwave/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Layout, Sidebar, GlobalSearch, NotificationBell
│   │   │   ├── goals/          # GoalCard, GoalFormModal, AIChatModal, ActivityModal,
│   │   │   │                   #   DeleteModal, ShareModal, goalHelpers
│   │   │   └── expenses/       # ExpenseTable, AddExpenseModal, ManageBudgetsModal
│   │   ├── pages/              # Dashboard, Goals, Habits, Journal, Chat, Focus,
│   │   │                       #   Profile, Expenses, Calendar, Auth
│   │   ├── context/            # Auth, Theme
│   │   └── lib/                # Axios, utils
│   ├── tailwind.config.js      # Custom xs breakpoint + theme tokens
│   └── public/                 # PWA icons & manifest
│
├── server/                     # Node.js Backend (Express)
│   ├── models/                 # User, Goal, Habit, Journal, VectorChunk, Expense, Budget
│   ├── routes/                 # Auth, Chat (Tool & RAG), Search, Goals, Habits, Expenses
│   ├── controllers/            # Business logic handlers
│   ├── middleware/             # Auth, Security (XSS, RateLimit, Sanitize)
│   ├── utils/                  # VectorStore, LLM Orchestration
│   └── index.js                # Entry point
│
└── start_app.bat               # Automated startup script (Windows)
```

---

## 📱 Mobile PWA Installation

MindWave is fully optimized for mobile with a native app-like experience.

Navigate to your local IP (e.g., `http://192.168.1.5:5173`) on your mobile browser.
- **Android:** "Install App" from the Chrome menu.
- **iOS:** "Add to Home Screen" from the Safari share sheet.

**Mobile UX highlights:**
- 8-item bottom nav bar — compact icon + label layout fits all phones including 360px screens
- Centered modal animations for Goals, Activity, Delete, and AI Chat
- `dvh`-based heights for correct sizing with collapsible browser chrome on iOS/Android
- Safe-area padding for notch/home-bar devices (iPhone X+)
- Responsive 2-column grids on small screens, expanding to 4 on desktop
- Touch-friendly tap targets with `active:scale` haptic feedback
- iOS input zoom prevention (16px base font on all inputs)

---

## ☁️ Deployment

This application is ready for production deployment:
- **Frontend**: Deploy `client/` to **Vercel** or **Netlify**.
- **Backend**: Deploy `server/` to **Render** or **Railway**.
- *Note: Ensure `ALLOWED_ORIGINS` in `server/index.js` includes your frontend URL.*

---

## 🔮 Roadmap

- [x] AI Chat with habit/goal tool execution
- [x] True Vector RAG for document chat
- [x] Multimodal Vision AI for image analysis
- [x] Smart Notification Bell with local triggers
- [x] Goal tracking with AI milestone generation
- [x] Mobile PWA support
- [x] Advanced Data Export (JSON/CSV)
- [x] Voice Interface (STT & TTS)
- [x] Mobile UI optimization (safe area, bottom nav, responsive grids)
- [x] Mobile-safe timer completion notifications (ServiceWorker API)
- [x] Interactive Productivity Target Sliders
- [x] Dashboard Quick Action Strip (Mobile UX)
- [x] **Financial OS (Bento Grid Expense Tracker)**
- [x] Shared Goals & Collaboration features
- [x] **Expense Tracker Mobile View** (glass-card system, FAB, responsive charts)
- [x] **Compact 8-item Bottom Nav** with scrollable strip
- [x] **dvh-based modal heights** for iOS/Android browser chrome
- [x] **Reverted to classic centered modal UX** for Goals, Activity, AI Chat
- [x] Backend-driven Push Notifications (Web Push API)
- [x] Integration with External Calendars (Google/Outlook)

---

## 📋 Changelog

### June 6, 2026 — Mobile UI Responsiveness & Layout Fixes
- 📱 **Bottom Navigation Optimization** — Reduced the mobile bottom navigation bar from 8 items down to 5 essential modules (Home, Chat, Habits, Calendar, Journal) to prevent horizontal scrolling and squished icons on narrow screens.
- 🛡️ **CSS Layout Hardening** — Removed an overly aggressive `max-width: 100%` wildcard rule that was breaking absolute/flex positioning across mobile viewports, while preserving horizontal scroll protection on `#root`.
- 📐 **Padding Unification** — Fixed a major issue where page content received double bottom-padding (from both the `Layout` wrapper and individual pages). The `.mobile-page-pad` utility now only applies the necessary inner spacing.
- 📅 **Calendar Consistency** — Applied consistent bottom padding to the Calendar page to ensure it isn't hidden behind the mobile bottom navigation bar.

### May 3, 2026 — Modal UX Revert (Classic Style)
- 🔄 **GoalsPage Header** — restored the original inline header layout with title on the left and compact action buttons (Ask AI + New Goal) on the right. Removed the sticky full-width 2-column action bar grid.
- 🪟 **GoalFormModal** — removed the mobile-only bottom-sheet slide-up pattern; now uses a single unified centered scale-in modal on all screen sizes.
- 💬 **AIChatModal** — reverted from `items-end` bottom-sheet positioning to a centered `scale-in` animation on all screen sizes.
- 📋 **ActivityModal** — removed the dual mobile/desktop modal split (bottom-sheet + drag handle on mobile, centered on desktop) and replaced with one consistent centered modal for all devices.
- 🧹 **Filter Pills** — removed sticky positioning from the Goals page filter pills; they now scroll naturally with the page.

### April 23, 2026 — Full Mobile Responsiveness Overhaul
- 📱 **Compact Bottom Navigation** — reduced icon/label sizing and min-width so all 8 navigation items fit on the narrowest phones (360px+) without any horizontal overflow or scrolling.
- 🪟 **Universal Bottom-Sheet Modals** — converted `ActivityModal` and `DeleteModal` from plain centered overlays to the bottom-sheet slide-up pattern with a drag handle.
- 📐 **dvh Modal Heights** — replaced all `85vh` modal heights with `min(85dvh, 600px)` to correctly account for collapsible browser address bars on iOS and Android Chrome.
- 🎯 **CSS Variable Sticky Bars** — replaced hardcoded `top-24` sticky offsets on the Goals page with `calc(var(--header-h) + 0.75rem)`.
- 🛡️ **Fixed max-width CSS Rule** — removed the `max-width: 100vw` on every `*` selector and replaced it with a scoped rule targeting block-level elements and `#root` only.
- 🎨 **xs Breakpoint** — added a custom `xs: 360px` Tailwind breakpoint for targeted small-phone styles.
- 📊 **Dashboard Stat Grid Fix** — removed erroneous `col-span-2` on the Goals stat card causing uneven layouts.

### April 22, 2026 — Expense Tracker Mobile View Overhaul
- 📱 **Unified Glass-Card System** — replaced all custom Expense cards with the global `glass-card` utility for consistent radii and glassmorphism.
- 🪟 **Constrained Layout** — swapped the unconstrained wrapper for the standard `max-w-7xl` layout.
- 📊 **Responsive Bar Chart** — switched from `barSize={40}` to `maxBarSize={40}`, allowing spending bars to shrink gracefully on small screens.
- 🔘 **FAB-First Action Pattern** — the "Log Entry" header button is hidden on mobile; replaced by the floating FAB.

### April 20, 2026 — Unified Mobile Navigation
- 📱 **Scrollable Bottom Nav** — upgraded the mobile bottom navigation bar into a horizontally scrollable strip with instant access to all core modules.

### April 18, 2026 — Shared Goals & Collaboration
- 🤝 **Collaborative Goal Tracking** — Added the ability to share goals with colleagues and friends via email with real-time milestone tracking.

### April 16, 2026 — Layout Resiliency & Local Dev Polish
- 🛡️ **Scroll-Proof Modal Architecture** — refactored the Add Transaction modal to use strict flex-based centering on desktop.
- ⚙️ **Dynamic Port Binding** — updated backend CORS logic to intelligently whitelist wildcard local ports.

### April 15, 2026 — Premium Financial UI & Interaction Polish
- 💎 **Premium Button Systems** — upgraded all primary action buttons in the Financial OS with Indigo-vibe theme and glassmorphism shine animations.
- 📱 **Mobile FAB Optimization** — implemented a high-visibility, glow-enhanced Floating Action Button for financial logging on mobile.

### April 13, 2026 — Financial UI Refinement & Analytical Stability
- 📈 **Weekly Spending Trends** — overhauled bar chart logic to provide a consistent 5-week breakdown for any selected month.
- 🏷️ **Smart Categorization UI** — dynamic category filtering in the transaction modal based on Income vs. Expense type.
- 🔍 **Safe Analytical Search** — hardened the global expense filtering with null-safe note searching.

### April 12, 2026 — Financial OS & Bento Grid Redesign
- 💎 **Bento Grid Architecture** — completely redesigned the Expense Tracker module into a modular Bento Grid system.
- 🇮🇳 **INR Localization** — standardized entire financial suite to **Indian Rupee (₹)** with `en-IN` formatting.
- 📊 **Dynamic Analytics** — implemented donut-style category distribution charts and surgical bar charts for spending history.
- 🎯 **Budget Thresholds** — added category-specific budget limits with real-time progress indicators.
- 💾 **CSV Export** — added full data portability to the financial module.

### April 10, 2026 — Productivity Logic & Dashboard UX
- 📈 **Personalized Productivity Targets** — users can now set custom productivity targets (0–100%) via an interactive range slider on the dashboard.
- ⚡ **Dashboard Quick Actions** — added a horizontal action slider for one-tap navigation to core features.

---

## 🛠 Repository Management

To keep the repository clean and secure, follow these guidelines:

### ✅ Files to COMMIT
- **Source Code**: `client/src/`, `server/` (controllers, models, routes, etc.)
- **Project Icons & Assets**: `client/public/`
- **Configuration**: `package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `vercel.json`, `.gitignore`
- **Documentation**: `README.md`, `RAG_IMPLEMENTATION.md`

### 🚫 Files to IGNORE
- **Sensitive Info**: `.env` (Never push API keys or Database URIs)
- **Dependencies**: `node_modules/` (Always re-install via `npm install`)
- **Build Artifacts**: `client/dist/`, `server/dist/`
- **Logs & Temp**: `*.log`, `*.txt`, `*_crash.json`, `test_*.js`

---

## 📄 License

MIT — feel free to fork and customize your own Life OS.

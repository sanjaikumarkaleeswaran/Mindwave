# 🧠 MindWave: Your AI-Powered Life OS

A self-hosted, private **"digital brain"** that organizes your entire life. MindWave combines intelligent AI chat, habit tracking, smart goal planning, journaling, and focus tools into a single, cohesive operating system for your daily routine.

---

## 🌟 Features

### 🤖 AI Chat Assistant
- **Powered by Groq / Llama 3.3 70b** — fast, intelligent, context-aware responses.
- **Multimodal Vision AI (New)** — upload images (screenshots, fitness stats, etc.). The backend automatically switches to high-performance vision models (`meta-llama/llama-4-scout-17b-16e-instruct`) to analyze your data visually.
- **Interactive Image Lightbox** — click any image in your chat history to open it in a beautiful, full-screen blurred "Lightbox" mode for detailed inspection.
- **Premium File Cards** — documents (PDFs, JS, JSON, etc.) are rendered as elegant, interactive file cards with automatic extension detection and one-click download.
- **True Vector RAG** — upload PDFs, TXT, or JSON files. The local Node.js server automatically chunks documents, generates 384-dimensional mathematical embeddings using `@xenova/transformers` (`all-MiniLM-L6-v2`), and mathematically retrieves the most relevant paragraphs using cosine similarity to answer your questions.
- **Habit control via chat** — say *"I drank water"* or *"Add a running habit"* and the AI updates your tracker automatically.
- **AI Habit Analysis** — ask *"How am I doing this week?"* for a personalized performance report with strengths and recommendations.
- **Multi-turn conversations** — full conversation memory with permanent document storage.

### 🎯 Smart Goal Tracking *(New)*
- **AI Goal Creator (Chat)** — describe a goal in plain language; AI generates a full structured plan with title, description, category, target date, and step-by-step milestones.
- **AI Milestone Generator** — inside the goal form, click "✨ AI Plan" to auto-generate 5–7 specific, dated milestones based on your target date.
- **Step-by-step Timeline** — visual timeline with numbered steps, due date countdowns (*"8d left"*, *"2d overdue"*), and spine connector lines.
- **Activity Logging** — click any step to open an activity modal, log what you did, and mark the step complete.
- **Dashboard Integration** — see active goals, their progress bars, and your immediate next steps right from your home screen.
- **Dedicated Calendar View** — see a unified monthly grid of all your milestone due dates, color-coded by category.
- **Smart Reminders** — an intelligent notification bell alerts you when milestones are overdue, due today, or coming up soon.
- **Dual Progress Tracking** — side-by-side time-elapsed bar vs actual progress bar with an **Ahead / On track / Behind** badge.
- **Progress Rings** — animated circular progress indicator on every goal card.
- **Milestone Dot Summary** — compact numbered dots on the card with tooltips; click any dot to log activity.
- **Full CRUD** — create, read, edit, delete goals with confirmation modals.
- **Fail-safe AI Redirect** — pencil icon quickly redirects you back to the main AI chat if you need more conversational planning.
- **Status Management** — mark goals as Active, Paused, Completed, or Archived.

### 📅 Advanced Habit Tracker
- **Streak Tracking** — monitor daily progress and current/best streaks.
- **Visual Consistency** — weekly calendar heatmaps to see your consistency at a glance.
- **Mobile-optimized** — easy tap-to-complete interface.
- **AI Insights** — qualitative feedback and actionable weekly challenges.

### ✍️ Intelligent Journaling
- **Mood Tracking** — capture your daily mood and identify trends over time.
- **AI Analysis** — instant sentiment analysis, key topics, and wellbeing challenges on every entry.
- **Secure & Private** — all entries stored securely in your own database.

### 🧘 Focus Mode
- **Pomodoro-style Timer** — built-in countdown to help you stay in flow state.
- **Ambient Soundscapes** — curated royalty-free audio (Cosmic, Nature, Lo-Fi) to block distractions.

### 🔍 Global Search
- **Unified Search** — search across goals, habits, and journal entries from a single search bar.

### 🛡️ Security & Privacy
- **Self-Hosted** — you own your data, stored in your own MongoDB instance.
- **Security Middleware** — Helmet, CORS, HPP, rate-limiting, XSS sanitization, and MongoDB injection prevention.
- **JWT Authentication** — secure stateless auth with bcrypt password hashing and email verification.
- **Danger Zone** — permanently wipe all data (journals, habits, chats, goals, account) from settings.

### 📱 PWA — Install as a Native App
- **Progressive Web App** — installable on iOS and Android for a full-screen, native-like experience.
- **Mobile-First Design** — responsive from 375px phones to large desktops.
- **Offline-Capable** — service worker caching for core assets.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **State / Routing** | React Context, React Router v6 |
| **PWA** | Vite PWA Plugin, Web App Manifest, Service Worker |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB via Mongoose 9 |
| **AI Engine** | Groq SDK — Llama 3.3 70b & Llama 4 Scout Vision |
| **Vector RAG** | `@xenova/transformers` (Local Node.js embeddings), Cosine Similarity |
| **Auth** | Custom JWT + Bcrypt + Nodemailer (email verification) |
| **Security** | Helmet, express-rate-limit, HPP, custom XSS & Mongo sanitizers |

See the full architectural breakdown in [RAG_IMPLEMENTATION.md](./RAG_IMPLEMENTATION.md).

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** v18+
2. **MongoDB Atlas** account or local MongoDB instance
3. **Groq API Key** — free at [console.groq.com](https://console.groq.com)
4. **Gmail App Password** — for email verification ([guide](https://support.google.com/accounts/answer/185833))

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sanjaikumarkaleeswaran/Mindwave.git
cd Mindwave

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install
```

---

### Environment Setup

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string_min_32_chars
GROQ_API_KEY=your_groq_api_key

# Email (Gmail App Password — no spaces)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your16charapppassword
```

> **Client API URL** — create `client/.env` if you need to access from another device on your network:
> ```env
> VITE_API_URL=http://YOUR_LOCAL_IP:5000/api
> ```

---

### Running the Application

**Option A — One click (Windows)**
```
Double-click  start_app.bat
```
This opens both the backend and frontend terminals automatically.

**Option B — Manual**
```bash
# Terminal 1 — Backend
cd server
npm start          # runs on http://localhost:5000

# Terminal 2 — Frontend
cd client
npm run dev        # runs on http://localhost:5173
```

---

## 📂 Project Structure

```
Mindwave/
├── client/                         # React Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI (Sidebar, Layout, GlobalSearch, NotificationBell)
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Overview stats & active goals
│   │   │   ├── GoalsPage.jsx       # AI goal creator, CRUD, milestone timeline
│   │   │   ├── CalendarPage.jsx    # Monthly grid of all goal milestone due dates
│   │   │   ├── HabitsPage.jsx      # Habit tracker with streaks & heatmaps
│   │   │   ├── JournalPage.jsx     # Journaling with AI mood analysis
│   │   │   ├── ChatPage.jsx        # AI assistant with file upload
│   │   │   ├── FocusPage.jsx       # Timer & ambient soundscapes
│   │   │   └── ProfilePage.jsx     # Settings & danger zone
│   │   └── lib/                    # Axios instance, date helpers
│   ├── public/                     # PWA icons, manifest
│   └── vite.config.js              # Vite & PWA configuration
│
├── server/                         # Express Backend
│   ├── models/
│   │   ├── User.js                 # User schema (auth, profile)
│   │   ├── Goal.js                 # Goal + Milestone schema (with notes, dueDate)
│   │   ├── Habit.js                # Habit schema (streaks, completedDates)
│   │   ├── Journal.js              # Journal entry schema
│   │   ├── ChatHistory.js          # Chat message schema
│   │   ├── Conversation.js         # Conversation thread schema
│   │   └── VectorChunk.js          # RAG chunk and embedding schema
│   ├── routes/
│   │   ├── auth.routes.js          # Register, login, verify email, forgot password
│   │   ├── goal.routes.js          # Goals CRUD + AI milestone/goal generation
│   │   ├── habit.routes.js         # Habits CRUD + streak logic
│   │   ├── journal.routes.js       # Journal CRUD + AI analysis
│   │   ├── chat.routes.js          # AI chat, True Vector RAG, tool execution
│   │   └── search.routes.js        # Global search across all collections
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── validate.middleware.js  # Joi schema validation
│   │   ├── mongoSanitize.js        # NoSQL injection prevention
│   │   ├── xssSanitize.js          # XSS attack prevention
│   │   └── rateLimiter.js          # Express rate limiting
│   ├── schemas/                    # Joi validation schemas
│   ├── utils/                      
│   │   ├── sendEmail.js            # Nodemailer utility
│   │   └── vectorStore.js          # Local embedding and cosine similarity logic
│   └── index.js                    # Server entry point
│
├── start_app.bat                   # One-click Windows startup
└── README.md
```

---

## 📱 Mobile PWA Installation

> Make sure your phone and computer are on the same Wi-Fi network.

1. Find your computer's local IP: run `ipconfig` (Windows) → look for `IPv4 Address`
2. Update `client/.env`:
   ```env
   VITE_API_URL=http://YOUR_LOCAL_IP:5000/api
   ```
3. Restart the client server

**Android (Chrome):** Navigate to `http://YOUR_IP:5173` → tap menu → **"Install App"**

**iOS (Safari):** Navigate to `http://YOUR_IP:5173` → tap Share → **"Add to Home Screen"**

---

## 🔮 Roadmap

- [x] AI Chat with habit tool execution
- [x] Habit tracker with streaks & heatmaps
- [x] Mood-aware journaling with AI analysis
- [x] Focus mode with ambient soundscapes
- [x] Goal tracking with AI milestone generation
- [x] Activity logging per milestone
- [x] Step-by-step timeline with due date tracking
- [x] Global search
- [x] PWA — installable on mobile
- [x] Security hardening (rate limiting, XSS, NoSQL injection)
- [x] Push notifications for milestone due dates
- [x] Calendar view for goal milestones
- [x] Export data (JSON / CSV)
- [x] Multimodal Vision AI for image analysis
- [x] Full-screen Image Lightbox
- [x] Interactive Document File Cards
- [ ] Voice interface

---

## 📄 License

MIT — feel free to fork, modify, and self-host.

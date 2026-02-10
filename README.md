# 🧠 MindWave: Your AI-Powered Life OS

A self-hosted, private "digital brain" that organizes your life. This application combines intelligent AI chat, robust habit tracking, journaling, and focus tools into a single, cohesive operating system for your daily routine.

![MindWave Dashboard](https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3)

## 🌟 Features

### 🤖 Context-Aware AI Chat
*   **Powered by Groq/Llama 3**: Fast, intelligent responses using the Groq SDK.
*   **Integrated Control**: The AI isn't just a chatbot; it connects to your data.
    *   **Habit Management**: Tell the AI "I drank water" or "Add a running habit", and it updates your tracker automatically.
    *   **Smart Analysis**: Ask for an analysis of your habit streaks ("How am I doing this week?"), and the AI will generate a personalized report.

### 📅 Advanced Habit Tracker
*   **Streak Tracking**: Monitor your daily progress and current streaks.
*   **Visual Consistency**: Weekly calendar views to visually see your consistency with heatmaps.
*   **AI Insights**: Get qualitative feedback on your performance and actionable advice for improvement.

### ✍️ Intelligent Journaling
*   **Mood Tracking**: Capture your daily mood and see trends over time.
*   **AI Analysis**: Get instant feedback on your entries, including sentiment analysis, key topics, and actionable challenges to improve your wellbeing.
*   **Secure & Private**: Your thoughts are stored securely.

### 🧘 Focus Mode
*   **Flow State Tools**: Built-in timer and ambient soundscapes to help you get into the zone.
*   **Curated Audio**: Selection of royalty-free ambient music (Cosmic, Nature, Lo-Fi) to block distractions.

### 🛡️ Privacy & Security
*   **Self-Hosted**: You own your data.
*   **Delete Everything**: A "Danger Zone" in settings allows you to permanently wipe all your data (journals, habits, chats, account) instantly.
*   **Secure Auth**: JWT-based authentication with email verification.

## 🛠 Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend**: Node.js, Express.
*   **Database**: MongoDB (via Mongoose).
*   **AI Engine**: Groq SDK (Llama 3.3 70b Versatile).
*   **Authentication**: Custom JWT implementation with Bcrypt hashing.

## 🚀 Getting Started

### Prerequisites
1.  **Node.js** (v18+ recommended)
2.  **MongoDB Atlas Account** or local MongoDB instance.
3.  **Groq API Key**: Get a free key from [console.groq.com](https://console.groq.com).

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/sanjaikumarkaleeswaran/Mindwave.git
    cd Mindwave
    ```

2.  **Install Dependencies**:
    *   **Server**:
        ```bash
        cd server
        npm install
        ```
    *   **Client**:
        ```bash
        cd ../client
        npm install
        ```

3.  **Environment Setup**:
    *   Create a `.env` file in the `server/` directory:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_secure_random_string
        GROQ_API_KEY=your_groq_api_key
        EMAIL_USER=your_email@gmail.com
        EMAIL_PASS=your_app_specific_password
        ```

### Running the Application

**Option A: The Easy Way (Windows)**
*   Double-click the `start_app.bat` file in the root directory. This will launch both the backend and frontend terminals automatically.

**Option B: Manual Start**
1.  **Start Backend**:
    ```bash
    cd server
    npm run dev
    ```
2.  **Start Frontend**:
    ```bash
    cd client
    npm run dev
    ```

## 📂 Project Structure

```
d:/webforme
├── client/                 # React Frontend & Vite Configuration
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Theme Context
│   │   ├── pages/          # Dashboard, Journal, Focus, Profile
│   │   └── lib/            # Utilities (Axios, Date helpers)
│   └── ...
├── server/                 # Express Backend
│   ├── models/             # Mongoose Schemas (User, Habit, Journal, Chat)
│   ├── routes/             # API Endpoints (Auth, Journal, Habits)
│   ├── middleware/         # Auth verification & Uploads
│   └── index.js            # Server entry point
└── start_app.bat           # One-click startup script
```

## 🔮 Future Roadmap
- [ ] Voice interface for hands-free interaction.
- [x] Mobile-responsive PWA (Progressive Web App).
- [ ] Export data feature (JSON/CSV).

## 📱 Mobile Installation (PWA)

MindWave is a Progressive Web App (PWA), meaning you can install it on your mobile device for a native app experience.

1.  **Ensuring Network Access**:
    *   Make sure your mobile device and computer are on the same WiFi network.
    *   Find your computer's local IP address (e.g., `10.x.x.x`).
    *   Update the `client/.env` file with `VITE_API_URL=http://YOUR_LOCAL_IP:5000/api`.
    *   Restart the client server.

2.  **Installing on Android (Chrome)**:
    *   Open Chrome and navigate to `http://YOUR_LOCAL_IP:5173`.
    *   Tap the menu (three dots) and select **"Install App"** or **"Add to Home Screen"**.

3.  **Installing on iOS (Safari)**:
    *   Open Safari and navigate to `http://YOUR_LOCAL_IP:5173`.
    *   Tap the **Share** button.
    *   Scroll down and select **"Add to Home Screen"**.

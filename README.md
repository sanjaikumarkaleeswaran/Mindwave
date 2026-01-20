# Personal AI Life OS

A self-hosted, private "digital brain" that organizes your life. This application combines an intelligent AI chatbot, a robust habit tracker, and a personalized music player into a single, cohesive operating system for your daily routine.

## 🌟 Features

### 🤖 Context-Aware AI Chat
*   **Powered by Groq/Llama 3**: Fast, intelligent responses using the Groq SDK.
*   **Integrated Control**: The AI isn't just a chatbot; it connects to your data.
    *   **Habit Management**: Tell the AI "I drank water" or "Add a running habit", and it updates your tracker automatically.
    *   **Music Control**: Ask for music recommendations based on your mood.
    *   **Smart Analysis**: Ask for an analysis of your habit streaks ("How am I doing this week?"), and the AI will generate a personalized report.

### 📅 Advanced Habit Tracker
*   **Streak Tracking**: monitor your daily progress and current streaks.
*   **Visual Consistency**: Weekly calendar views to visually see your consistency.
*   **AI Insights**: Get qualitative feedback on your performance and actionable advice for improvement.

### 🎵 Personal Music Player
*   **Mood Tagging**: organize your library by mood (Focus, Chill, Workout).
*   **Custom Library**: Manage your own collection of tracks.
*   **Seamless Playback**: Persistent player that continues while you navigate the app.

## 🛠 Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend**: Node.js, Express.
*   **Database**: MongoDB (via Mongoose).
*   **AI Engine**: Groq SDK (Llama 3.3 70b Versatile).
*   **Authentication**: JWT-based secure auth.

## 🚀 Getting Started

### Prerequisites
1.  **Node.js** (v18+ recommended)
2.  **MongoDB Atlas Account**: You need a connection string for the database.
3.  **Groq API Key**: Get a free key from [console.groq.com](https://console.groq.com).

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd webforme
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
    *   Create a `.env` file in the `server/` directory.
    *   Add the following variables:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_secure_random_string
        GROQ_API_KEY=your_groq_api_key
        ```

### Running the Application

**Option A: The Easy Way (Windows)**
*   Double-click the `start_app.bat` file in the root directory. This will launch both the backend and frontend terminals automatically.

**Option B: Manual Start**
1.  **Start Backend**:
    ```bash
    cd server
    npm start
    ```
2.  **Start Frontend**:
    ```bash
    cd client
    npm run dev
    ```

## 📂 Project Structure

```
d:/webforme
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Player Contexts
│   │   ├── pages/          # Main application pages
│   │   └── lib/            # Utilities (Axios, etc.)
│   └── ...
├── server/                 # Express Backend
│   ├── models/             # Mongoose Schemas (User, Habit, Music, Chat)
│   ├── routes/             # API Endpoints
│   ├── middleware/         # Auth verification
│   └── index.js            # Server entry point
└── start_app.bat           # One-click startup script
```

## 🔮 Future Roadmap
- [ ] Voice interface for hands-free interaction.
- [ ] Spotify/YouTube integration for broader music access.
- [ ] Mobile-responsive PWA (Progressive Web App).

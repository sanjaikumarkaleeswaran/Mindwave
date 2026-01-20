# Personal AI Life OS

A self-hosted, private AI 'digital brain' featuring Chat, Habits, and Music.

## 🚀 Quick Start

1.  **Database Setup**:
    *   Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database).
    *   Get your connection string (URI).
    *   Open `server/.env` and replace `MONGO_URI` with your actual string.
    *   (Optional) Update `JWT_SECRET` to a secure random string.

2.  **Run the App**:
    *   Double-click `start_app.bat` to launch both servers.
    *   **OR** run manually:
        *   Backend: `cd server && npm start`
        *   Frontend: `cd client && npm run dev`

3.  **Access**:
    *   Open [http://localhost:5173](http://localhost:5173) in your browser.
    *   Register a new account to get started.

## 🛠 Features

*   **AI Chat**: Talk to your assistant (mocked for demo, connects to `/api/chat/send`).
*   **Music Player**: Upload and play your own music links. Mood tagging supported.
*   **Habit Tracker**: Track daily habits and streaks.
*   **Design**: Modern, dark-themed UI built with React & Tailwind.

## 📁 Structure

*   `/client`: Vite React Frontend
*   `/server`: Node.js Express Backend

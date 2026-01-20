@echo off
echo Starting Personal AI Life OS...
start "Backend Server" cmd /k "cd server && npm start"
start "Frontend Client" cmd /k "cd client && npm run dev"
echo App is starting!
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:5173
echo Please ensure you have updated the .env file in /server with your MongoDB URI.
pause

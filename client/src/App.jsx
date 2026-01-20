import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import MusicPage from './pages/MusicPage';
import HabitsPage from './pages/HabitsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider> {/* Added PlayerProvider */}
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
              <Route index element={<Dashboard />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/:id" element={<ChatPage />} />
              <Route path="music" element={<MusicPage />} />
              <Route path="habits" element={<HabitsPage />} />
            </Route>
          </Routes>
        </PlayerProvider> {/* Closed PlayerProvider */}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

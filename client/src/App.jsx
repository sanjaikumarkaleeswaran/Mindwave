import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';

import HabitsPage from './pages/HabitsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

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

            <Route path="habits" element={<HabitsPage />} />
          </Route>
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

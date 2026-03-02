import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';



import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';

// Lazy Load Pages
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const FocusPage = React.lazy(() => import('./pages/FocusPage'));
const JournalPage = React.lazy(() => import('./pages/JournalPage'));
const HabitsPage = React.lazy(() => import('./pages/HabitsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage'));




function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={
            <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
              <AuthPage />
            </Suspense>
          } />
          <Route path="/forgot-password" element={
            <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
              <ForgotPasswordPage />
            </Suspense>
          } />
          <Route path="/reset-password/:token" element={
            <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
              <ResetPasswordPage />
            </Suspense>
          } />
          <Route path="/verify-email/:token" element={
            <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
              <VerifyEmailPage />
            </Suspense>
          } />

          <Route path="/" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Dashboard...</div>}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="chat" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Chat...</div>}>
                <ChatPage />
              </Suspense>
            } />
            <Route path="chat/:id" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Chat...</div>}>
                <ChatPage />
              </Suspense>
            } />
            <Route path="focus" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Focus Mode...</div>}>
                <FocusPage />
              </Suspense>
            } />
            <Route path="journal" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Journal...</div>}>
                <JournalPage />
              </Suspense>
            } />
            <Route path="habits" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Habits...</div>}>
                <HabitsPage />
              </Suspense>
            } />
            <Route path="profile" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Profile...</div>}>
                <ProfilePage />
              </Suspense>
            } />
            <Route path="goals" element={
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white h-full">Loading Goals...</div>}>
                <GoalsPage />
              </Suspense>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

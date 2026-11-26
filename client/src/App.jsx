import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChallengeDetailPage from './pages/ChallengeDetailPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitChallengePage from './pages/citizen/SubmitChallengePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import UniversityDashboard from './pages/university/UniversityDashboard';
import IndustryDashboard from './pages/industry/IndustryDashboard';

export function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = () => setPaletteOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
              <Navbar onOpenSearch={() => setPaletteOpen(true)} />
              <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
              <main>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/challenges/:id" element={<ChallengeDetailPage />} />

                  <Route
                    path="/citizen"
                    element={
                      <ProtectedRoute allowedRoles={['citizen']}>
                        <CitizenDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/submit"
                    element={
                      <ProtectedRoute allowedRoles={['citizen']}>
                        <SubmitChallengePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'industry']}>
                        <AnalyticsDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/university"
                    element={
                      <ProtectedRoute allowedRoles={['university']}>
                        <UniversityDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/industry"
                    element={
                      <ProtectedRoute allowedRoles={['industry']}>
                        <IndustryDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

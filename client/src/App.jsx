import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import EmbedMapPage from './pages/EmbedMapPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChallengeDetailPage from './pages/ChallengeDetailPage';
import ProfilePage from './pages/ProfilePage';
import VerificationSettingsPage from './pages/VerificationSettingsPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitChallengePage from './pages/citizen/SubmitChallengePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import UniversityDashboard from './pages/university/UniversityDashboard';
import IndustryDashboard from './pages/industry/IndustryDashboard';

const AppShell = ({ paletteOpen, setPaletteOpen }) => {
  const location = useLocation();
  const isEmbed = location.pathname.startsWith('/embed/');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {!isEmbed && <Navbar onOpenSearch={() => setPaletteOpen(true)} />}
      {!isEmbed && <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/embed/map" element={<EmbedMapPage />} />
          <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
                    <Route path="/profile/:id" element={<ProfilePage />} />
                    <Route path="/verify/cert/:proposalId" element={<CertificateVerifyPage />} />

                    <Route
                      path="/settings/verification"
                      element={
                        <ProtectedRoute allowedRoles={['citizen', 'admin', 'university', 'industry']}>
                          <VerificationSettingsPage />
                        </ProtectedRoute>
                      }
                    />

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
  );
};

export function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = () => setPaletteOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppShell paletteOpen={paletteOpen} setPaletteOpen={setPaletteOpen} />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

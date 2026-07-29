import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute.jsx';
import AppLayout from '@/components/layout/AppLayout.jsx';

// Auth pages
import LoginPage          from '@/pages/LoginPage.jsx';
import RegisterPage       from '@/pages/RegisterPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage  from '@/pages/ResetPasswordPage.jsx';

// Protected pages
import DashboardPage       from '@/pages/DashboardPage.jsx';
import ProfilePage         from '@/pages/ProfilePage.jsx';
import AssessmentPage      from '@/pages/AssessmentPage.jsx';
import PredictionResultPage from '@/pages/PredictionResultPage.jsx';
import ReportHistoryPage   from '@/pages/ReportHistoryPage.jsx';
import NotFoundPage        from '@/pages/NotFoundPage.jsx';

/**
 * Central route definition.
 *
 * Public  — /login, /register, /forgot-password, /reset-password/:token
 * Protected — /dashboard, /profile  (inside PrivateRoute + AppLayout)
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ── Root redirect ────────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── Public auth routes ───────────────────────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* ── Protected routes (JWT required) ─────────────────────────────── */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/profile"    element={<ProfilePage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/prediction" element={<PredictionResultPage />} />
          <Route path="/reports"    element={<ReportHistoryPage />} />
        </Route>
      </Route>

      {/* ── 404 ──────────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;

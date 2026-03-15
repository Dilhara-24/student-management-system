// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students  from './pages/Students';
import Courses   from './pages/Courses';
import Intakes   from './pages/Intakes';
import Admins    from './pages/Admins';
import Logs      from './pages/Logs';

// ── Guards ────────────────────────────────────────────────────────────────────

// If logged in, block access to /login → send to /dashboard
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
};

// If NOT logged in, block access to protected pages → send to /login
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public — only accessible when NOT logged in */}
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        {/* Private — only accessible when logged in */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/students"  element={<PrivateRoute><Students /></PrivateRoute>} />
        <Route path="/courses"   element={<PrivateRoute><Courses /></PrivateRoute>} />
        <Route path="/intakes"   element={<PrivateRoute><Intakes /></PrivateRoute>} />
        <Route path="/admins"    element={<PrivateRoute><Admins /></PrivateRoute>} />
        <Route path="/logs"      element={<PrivateRoute><Logs /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

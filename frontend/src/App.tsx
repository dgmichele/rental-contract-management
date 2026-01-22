import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Toaster, type ToastPosition } from 'react-hot-toast';
import { useState, useEffect } from 'react';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Protected Pages
import Dashboard from './pages/dashboard/Dashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';

/**
 * APP - ROUTING PRINCIPALE
 * 
 * Gestisce il routing dell'intera applicazione.
 * - Route pubbliche: login, register, forgot-password, reset-password
 * - Route protette: dashboard (e altre in futuro)
 * - Redirect intelligente dalla root: /login se non autenticato, /dashboard se autenticato
 * - Toaster globale: configurato qui per gestire il posizionamento responsivo
 */
function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [toastPosition, setToastPosition] = useState<ToastPosition>('top-right');

  // Gestione responsive della posizione del Toaster
  useEffect(() => {
    const handleResize = () => {
      // < 1024px (lg) -> bottom-center
      // >= 1024px -> top-right
      if (window.innerWidth < 1024) {
        setToastPosition('bottom-center');
      } else {
        setToastPosition('top-right');
      }
    };

    // Controllo iniziale
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Routes>
        {/* Root Redirect - Intelligente basato su autenticazione */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ============= PUBLIC ROUTES (Auth) ============= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ============= PROTECTED ROUTES ============= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

      {/* TODO: Altre route protette da implementare nelle fasi successive */}
      {/* 
      <Route path="/owners" element={<ProtectedRoute><OwnersList /></ProtectedRoute>} />
      <Route path="/owners/:id" element={<ProtectedRoute><OwnerDetail /></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute><ContractsList /></ProtectedRoute>} />
      <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      */}
      
        {/* 404 - Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* TOASTER GLOBALE */}
      <Toaster
        position={toastPosition}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fffbfc',
            color: '#1e1e1e',
            border: '1px solid #f0d6da',
          },
          success: {
            iconTheme: {
              primary: '#b41c3c',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;


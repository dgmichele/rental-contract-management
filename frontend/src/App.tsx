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
import OwnersListPage from './pages/owners/OwnersListPage';
import OwnerDetailPage from './pages/owners/OwnerDetailPage';
import ContractsListPage from './pages/contracts/ContractsListPage';
import ContractDetailPage from './pages/contracts/ContractDetailPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

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
      // < 1280px (xl) -> bottom-center
      // >= 1280px -> top-right
      if (window.innerWidth < 1280) {
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
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/owners" element={<OwnersListPage />} />
          <Route path="/owners/:id" element={<OwnerDetailPage />} />
          
          <Route path="/contracts" element={<ContractsListPage />} />
          <Route path="/contracts/new" element={<ContractDetailPage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          
          {/* 
          <Route path="/settings" element={<Settings />} />
          */}
        </Route>
      
        {/* 404 - Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* TOASTER GLOBALE */}
      <Toaster
        position={toastPosition}
        containerStyle={{
          // Evita sovrapposizione con Header Sticky su Desktop
          top: toastPosition === 'top-right' ? 80 : 20,
          // Evita sovrapposizione con Bottom Nav Sticky su Mobile/Tablet
          bottom: toastPosition === 'bottom-center' ? 80 : 20,
        }}
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


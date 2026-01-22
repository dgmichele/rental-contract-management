import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * PROTECTED ROUTE COMPONENT
 * 
 * Wrapper per route che richiedono autenticazione.
 * Se l'utente non è autenticato, viene reindirizzato a /login.
 * 
 * Uso:
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // Redirect a login se non autenticato
    return <Navigate to="/login" replace />;
  }

  // Renderizza il componente figlio se autenticato
  return <>{children}</>;
}

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/api/auth.service';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth';

/**
 * CUSTOM HOOK - AUTENTICAZIONE
 * 
 * Fornisce metodi per login, register, logout e password reset.
 * Gestisce automaticamente:
 * - Aggiornamento store Zustand
 * - Navigazione post-login/logout
 * - Toast notifications
 * - Error handling
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();

  // ============= LOGIN =============
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (response) => {
      // Salva user + tokens nello store
      setAuth(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      // Toast di successo
      toast.success(`Benvenuto, ${response.data.user.name}! 🎉`);

      // Redirect a dashboard
      navigate('/dashboard');
    },
    onError: (error: any) => {
      // Toast di errore
      const message = error.response?.data?.message || 'Errore durante il login';
      toast.error(message);
    },
  });

  // ============= REGISTER =============
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (response) => {
      // Salva user + tokens nello store
      setAuth(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      // Toast di successo
      toast.success(`Account creato con successo! Benvenuto, ${response.data.user.name}! 🎉`);

      // Redirect a dashboard
      navigate('/dashboard');
    },
    onError: (error: any) => {
      // Toast di errore
      const message = error.response?.data?.message || 'Errore durante la registrazione';
      toast.error(message);
    },
  });

  // ============= LOGOUT =============
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    },
    onSuccess: () => {
      // Pulisci store
      clearAuth();

      // Toast di successo
      toast.success('Logout effettuato con successo');

      // Redirect a login
      navigate('/login');
    },
    onError: (error: any) => {
      // Anche in caso di errore, effettua logout locale
      clearAuth();
      navigate('/login');

      const message = error.response?.data?.message || 'Errore durante il logout';
      toast.error(message);
    },
  });

  // ============= FORGOT PASSWORD =============
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: ForgotPasswordRequest) => authService.forgotPassword(email),
    onSuccess: (response) => {
      toast.success(response.message || 'Email inviata! Controlla la tua casella di posta.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'invio dell\'email';
      toast.error(message);
    },
  });

  // ============= RESET PASSWORD =============
  const resetPasswordMutation = useMutation({
    mutationFn: (resetData: ResetPasswordRequest) => authService.resetPassword(resetData),
    onSuccess: (response) => {
      toast.success(response.message || 'Password reimpostata con successo!');
      
      // Redirect a login dopo 1.5 secondi
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante il reset della password';
      toast.error(message);
    },
  });

  // ============= RETURN =============
  return {
    // Login
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    // Register
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    // Logout
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    // Forgot Password
    forgotPassword: forgotPasswordMutation.mutate,
    isSendingResetEmail: forgotPasswordMutation.isPending,

    // Reset Password
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};

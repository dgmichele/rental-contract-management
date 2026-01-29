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
      setAuth(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      toast.success(`Benvenuto, ${response.data.user.name}! 🎉`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante il login';
      // I toast non vengono mostrati per errori specifici dei campi, gestiti manualmente nel form
      if (message !== 'Email non trovata' && message !== 'Password errata') {
        toast.error(message);
      }
    },
  });

  // ============= REGISTER =============
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (response) => {
      setAuth(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      toast.success(`Account creato con successo! Benvenuto, ${response.data.user.name}! 🎉`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante la registrazione';
      // Supponiamo che la registrazione possa avere errori di campo (es. email duplicata)
      // Se il backend restituisce "Email già registrata", lo gestiamo nel form
      if (message !== 'Email già registrata') {
        toast.error(message);
      }
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
      clearAuth();
      toast.success('Logout effettuato con successo');
      navigate('/login');
    },
    onError: (error: any) => {
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
      if (message !== 'Email non registrata') {
        toast.error(message);
      }
    },
  });

  // ============= RESET PASSWORD =============
  const resetPasswordMutation = useMutation({
    mutationFn: (resetData: ResetPasswordRequest) => authService.resetPassword(resetData),
    onSuccess: (response) => {
      toast.success(response.message || 'Password reimpostata con successo!');
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
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    // Register
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    // Logout
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    // Forgot Password
    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    isSendingResetEmail: forgotPasswordMutation.isPending,

    // Reset Password
    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};

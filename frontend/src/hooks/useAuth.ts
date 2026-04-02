import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { getErrorMessage, type HandledAxiosError } from '../utils/errorHandler';
import type { ApiError } from '../types/api';

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
  const queryClient = useQueryClient();
  const { setAuth, clearAuth } = useAuthStore();

  // ============= LOGIN =============
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (response) => {
      // SECURITY: Pulisci cache React Query della sessione precedente
      // per evitare data leak cross-account
      queryClient.clear();

      setAuth(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      toast.success(`Benvenuto, ${response.data.user.name}! 🎉`);
      navigate('/dashboard');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || 'Errore durante il login';
      // I toast non vengono mostrati per errori specifici dei campi, gestiti manualmente nel form
      if (message !== 'Email non trovata' && message !== 'Password errata') {
        toast.error(message, { id: 'auth-login-error' });
      }
    },
  });

  // ============= REGISTER =============
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (response) => {
      // SECURITY: Pulisci cache React Query della sessione precedente
      // per evitare data leak cross-account
      queryClient.clear();

      setAuth(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      toast.success(`Account creato con successo! Benvenuto, ${response.data.user.name}! 🎉`);
      navigate('/dashboard');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || 'Errore durante la registrazione';
      // Supponiamo che la registrazione possa avere errori di campo (es. email duplicata)
      // Se il backend restituisce "Email già registrata", lo gestiamo nel form
      if (message !== 'Email già registrata') {
        toast.error(message, { id: 'auth-register-error' });
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
      queryClient.clear();
      toast.success('Logout effettuato con successo');
      navigate('/login');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
      if (error._isHandled) return;
      const message = getErrorMessage(error) || 'Errore durante il logout';
      toast.error(message, { id: 'auth-logout-error' });
    },
  });

  // ============= FORGOT PASSWORD =============
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: ForgotPasswordRequest) => authService.forgotPassword(email),
    onSuccess: (response) => {
      toast.success(response.message || 'Email inviata! Controlla la tua casella di posta.');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || 'Errore durante l\'invio dell\'email';
      if (message !== 'Email non registrata') {
        toast.error(message, { id: 'auth-forgot-error' });
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
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || 'Errore durante il reset della password';
      toast.error(message, { id: 'auth-reset-error' });
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

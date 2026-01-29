import api from './axios.config';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  RefreshTokenResponse,
  GenericAuthResponse,
} from '../../types/auth';

/**
 * AUTH SERVICE
 * Gestisce tutte le chiamate API relative all'autenticazione.
 */
class AuthService {
  /**
   * LOGIN
   * Autentica un utente con email e password.
   * 
   * @param credentials - Email e password
   * @returns User + tokens
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', credentials);
    return data;
  }

  /**
   * REGISTER
   * Registra un nuovo utente.
   * 
   * @param userData - Nome, cognome, email, password
   * @returns User + tokens
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', userData);
    return data;
  }

  /**
   * LOGOUT
   * Invalida il refresh token sul backend.
   * 
   * @param refreshToken - Token da invalidare
   */
  async logout(refreshToken: string): Promise<GenericAuthResponse> {
    const { data } = await api.post<GenericAuthResponse>('/api/auth/logout', {
      refreshToken,
    });
    return data;
  }

  /**
   * REFRESH TOKEN
   * Ottiene un nuovo access token usando il refresh token.
   * 
   * @param refreshToken - Refresh token valido
   * @returns Nuovo access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>('/api/auth/refresh', {
      refreshToken,
    });
    return data;
  }

  /**
   * FORGOT PASSWORD (Step 1)
   * Invia email con link per reset password.
   * 
   * @param email - Email dell'utente
   */
  async forgotPassword(email: ForgotPasswordRequest): Promise<GenericAuthResponse> {
    const { data } = await api.post<GenericAuthResponse>(
      '/api/auth/forgot-password',
      email
    );
    return data;
  }

  /**
   * RESET PASSWORD (Step 2)
   * Resetta la password usando il token ricevuto via email.
   * 
   * @param resetData - Token + nuova password
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<GenericAuthResponse> {
    const { data } = await api.post<GenericAuthResponse>(
      '/api/auth/reset-password',
      resetData
    );
    return data;
  }
}

// Esporta istanza singleton
export const authService = new AuthService();

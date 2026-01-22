/**
 * TYPES - AUTHENTICATION
 * Definizioni TypeScript per autenticazione e gestione utenti.
 */

// ============= USER =============

/**
 * Utente autenticato (dati salvati in store/localStorage).
 */
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string; // ISO 8601 date string
}

// ============= TOKENS =============

/**
 * Coppia di token JWT ricevuti dal backend.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============= AUTH REQUESTS =============

/**
 * Payload per richiesta di login.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Payload per richiesta di registrazione.
 */
export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
}

/**
 * Payload per richiesta di reset password (step 1: invio email).
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Payload per richiesta di reset password (step 2: conferma con token).
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============= AUTH RESPONSES =============

/**
 * Risposta del backend per login/register (successo).
 */
export interface AuthResponse {
  success: true;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Risposta del backend per refresh token.
 */
export interface RefreshTokenResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
  };
}

/**
 * Risposta generica per operazioni auth (es. forgot password, reset password).
 */
export interface GenericAuthResponse {
  success: true;
  message: string;
}

// ============= AUTH STORE STATE =============

/**
 * Stato dello store Zustand per autenticazione.
 */
export interface AuthState {
  // Dati utente
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Stato UI
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, AuthTokens } from '../types/auth';

/**
 * ZUSTAND STORE - AUTENTICAZIONE
 * 
 * Gestisce lo stato globale dell'autenticazione con persistenza in localStorage.
 * Include user, tokens e metodi per login/logout.
 * 
 * Persistenza:
 * - user, accessToken, refreshToken salvati in localStorage
 * - Sopravvive al refresh della pagina
 * - Viene pulito al logout
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ============= STATE INIZIALE =============
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // ============= ACTIONS =============

      /**
       * Salva dati utente e tokens dopo login/register.
       * Imposta isAuthenticated a true.
       */
      setAuth: (user: User, tokens: AuthTokens) => {
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });

        // Salva anche in localStorage separato per axios interceptor
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      },

      /**
       * Pulisce tutti i dati auth (logout).
       * Rimuove anche da localStorage.
       */
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // Pulisci localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      },

      /**
       * Aggiorna parzialmente i dati utente (es. dopo modifica profilo).
       */
      updateUser: (updatedFields: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        }));
      },
    }),
    {
      name: 'auth-storage', // Nome chiave in localStorage
      partialize: (state) => ({
        // Salva solo questi campi in localStorage
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

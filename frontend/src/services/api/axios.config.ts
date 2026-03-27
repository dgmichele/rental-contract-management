import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { handleGlobalError } from '../../utils/errorHandler';
import { useAuthStore } from '../../store/authStore';
import type { ApiError } from '../../types/api';

/**
 * Istanza Axios configurata per comunicare con il backend.
 * Include interceptors per gestione JWT e refresh token automatico.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000, // 15 secondi
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Aggiunge automaticamente il JWT access token a ogni richiesta (se presente).
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Recupera access token da localStorage
    const accessToken = localStorage.getItem('accessToken');

    // Se esiste, aggiungi all'header Authorization
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Variabili per gestire il refresh token in modo atomico ed evitare race conditions
let isRefreshing = false;
let failedQueue: any[] = [];

/**
 * Gestisce la coda di richieste in attesa del nuovo access token.
 * @param error Errore se il refresh è fallito
 * @param token Nuovo access token se il refresh ha avuto successo
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * RESPONSE INTERCEPTOR
 * Gestisce errori 401 (Unauthorized) tentando refresh token automatico.
 * Se il refresh fallisce, effettua logout e redirect a /login.
 * 
 * Implementato con coda di richieste per gestire chiamate concorrenti.
 */
api.interceptors.response.use(
  // Success: ritorna response normalmente
  (response) => response,

  // Error: gestione 401 e refresh token
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Verifica se è un errore 401 e NON abbiamo già ritentato
    // ESCLUDI anche la rotta di login, altrimenti un login fallito innesca un refresh loop
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/login')
    ) {
      // Se c'è già un refresh in corso, mettiamo questa richiesta in coda
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Recupera refresh token da localStorage
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        console.log('[AXIOS] Access token scaduto, tentativo refresh...');

        // Chiamata API per refresh token (senza interceptor per evitare loop)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );

        // Salva nuovo access token
        const newAccessToken = data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        console.log('[AXIOS] Access token rinnovato con successo');

        // Elabora la coda con il nuovo token
        processQueue(null, newAccessToken);

        // Aggiorna header della richiesta originale con nuovo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Riprova la richiesta originale
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token fallito: pulizia e logout
        console.error('[AXIOS] Refresh token fallito, logout necessario');

        // Invalida la coda con l'errore
        processQueue(refreshError, null);

        // Pulisci lo store
        useAuthStore.getState().clearAuth();

        // Redirect a login (solo se non siamo già lì)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Gestore errori globali (mostra toast per Network Error, 5xx, 403, ecc.)
    // Ignora errori di refresh per evitare doppi log
    if (!originalRequest.url?.includes('/auth/refresh')) {
      handleGlobalError(error);
    }

    // Per tutti gli altri errori, passa al catch della chiamata
    return Promise.reject(error);
  }
);

export default api;
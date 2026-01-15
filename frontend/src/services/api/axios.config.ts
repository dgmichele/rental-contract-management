import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

/**
 * RESPONSE INTERCEPTOR
 * Gestisce errori 401 (Unauthorized) tentando refresh token automatico.
 * Se il refresh fallisce, effettua logout e redirect a /login.
 */
api.interceptors.response.use(
  // Success: ritorna response normalmente
  (response) => response,

  // Error: gestione 401 e refresh token
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Verifica se è un errore 401 e NON abbiamo già ritentato
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Recupera refresh token da localStorage
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        console.log('[AXIOS] Access token scaduto, tentativo refresh...');

        // Chiamata API per refresh token (senza interceptor per evitare loop)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refreshToken }
        );

        // Salva nuovo access token
        const newAccessToken = data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        console.log('[AXIOS] Access token rinnovato con successo');

        // Aggiorna header della richiesta originale con nuovo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Riprova la richiesta originale
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token fallito: logout e redirect
        console.error('[AXIOS] Refresh token fallito, logout necessario');

        // Pulisci localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect a login (solo se non siamo già lì)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Per tutti gli altri errori, passa al catch della chiamata
    return Promise.reject(error);
  }
);

export default api;
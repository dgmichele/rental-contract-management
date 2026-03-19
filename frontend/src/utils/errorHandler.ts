import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import type { ApiError } from '../types/api';

/**
 * Utility per mappare errori HTTP a messaggi user-friendly
 * 
 * @param error - Errore Axios con tipo ApiError
 * @returns Messaggio di errore localizzato in italiano
 */
export const getErrorMessage = (error: AxiosError<ApiError>): string => {
  const status = error.response?.status;
  const data = error.response?.data;
  
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0].message || 'Dati di input non validi';
  }

  const message = data?.message;

  switch (status) {
    case 400:
      return message || 'Dati non validi';
    case 401:
      return 'Sessione scaduta, effettua nuovamente il login';
    case 403:
      return 'Non hai i permessi per questa operazione';
    case 404:
      return message || 'Risorsa non trovata';
    case 409:
      return message || 'Risorsa già esistente';
    case 500:
      return 'Errore del server, riprova più tardi';
    default:
      if (!error.response) return 'Errore di connessione al server';
      return message || 'Riprova più tardi';
  }
};

/**
 * Gestore globale degli errori per gli interceptor di Axios.
 * Mostra notifiche Toast per errori di sistema o server, 
 * ignorando gli errori utente (come le validazioni form 400).
 * 
 * @param error - Errore Axios
 */
export const handleGlobalError = (error: AxiosError<ApiError>) => {
  const status = error.response?.status;

  // Errore di rete (server irraggiungibile)
  if (!error.response && error.message === 'Network Error') {
    toast.error('Impossibile connettersi al server. Controlla la tua connessione.');
    return;
  }

  // Errori Server (5xx)
  if (status && status >= 500) {
    toast.error(getErrorMessage(error));
    return;
  }

  // Errori Auth critici (non gestiti dal refresh o dopo il fallimento del refresh)
  // Nota: l'interceptor gestisce già i 401 eseguendo il refresh e/o logout
  if (status === 403) {
    toast.error('Accesso negato: non possiedi i permessi necessari.');
    return;
  }
};

import { AxiosError } from 'axios';
import type { ApiError } from '../types/api';

/**
 * Utility per mappare errori HTTP a messaggi user-friendly
 * 
 * @param error - Errore Axios con tipo ApiError
 * @returns Messaggio di errore localizzato in italiano
 */
export const getErrorMessage = (error: AxiosError<ApiError>): string => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

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
      return message || 'Errore di connessione';
  }
};

import api from './axios.config';
import type { User, UpdateDetailsRequest, UpdatePasswordRequest } from '../../types/auth';

/**
 * USER SERVICE
 * Gestisce le chiamate API relative al profilo utente.
 */
class UserService {
  /**
   * GET ME
   * Recupera i dati dell'utente autenticato.
   */
  async getMe(): Promise<{ success: boolean; data: User }> {
    const { data } = await api.get('/user/me');
    return data;
  }

  /**
   * UPDATE DETAILS
   * Aggiorna nome, cognome ed email dell'utente.
   */
  async updateDetails(details: UpdateDetailsRequest): Promise<{ success: boolean; data: User; message: string }> {
    const { data } = await api.put('/user/me/details', details);
    return data;
  }

  /**
   * UPDATE PASSWORD
   * Aggiorna la password dell'utente.
   */
  async updatePassword(passwordData: UpdatePasswordRequest): Promise<{ success: boolean; message: string }> {
    const { data } = await api.put('/user/me/password', passwordData);
    return data;
  }
}

export const userService = new UserService();

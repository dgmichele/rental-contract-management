import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '../services/api/user.service';
import { useAuthStore } from '../store/authStore';
import type { UpdateDetailsRequest, UpdatePasswordRequest } from '../types/auth';
import { getErrorMessage, type HandledAxiosError } from '../utils/errorHandler';
import { invalidateRelatedQueries } from '../utils/queryInvalidator';
import type { ApiError } from '../types/api';

/**
 * HOOK - AGGIORNA DATI UTENTE
 * Aggiorna nome, cognome ed email dell'utente e lo store globale.
 */
export const useUpdateDetails = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (details: UpdateDetailsRequest) => userService.updateDetails(details),
    onSuccess: (response) => {
      // Aggiorna lo store Zustand locale
      updateUser(response.data);
      
      // Invalida eventuali query che usano i dati dell'utente
      invalidateRelatedQueries(queryClient, 'user');
      
      toast.success(response.message || 'Profilo aggiornato con successo! ✅');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || "Errore durante l'aggiornamento del profilo";
      toast.error(message, { id: 'profile-update-error' });
    },
  });
};

/**
 * HOOK - AGGIORNA PASSWORD
 */
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (passwordData: UpdatePasswordRequest) => userService.updatePassword(passwordData),
    onSuccess: (response) => {
      toast.success(response.message || 'Password aggiornata con successo! 🔐');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || "Errore durante l'aggiornamento della password";
      toast.error(message, { id: 'password-update-error' });
    },
  });
};

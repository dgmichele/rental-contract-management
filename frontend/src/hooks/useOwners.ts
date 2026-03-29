import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ownersService from '../services/api/owners.service';
import type { CreateOwnerRequest, UpdateOwnerRequest } from '../types/owner';
import toast from 'react-hot-toast';
import { getErrorMessage, type HandledAxiosError } from '../utils/errorHandler';
import { QUERY_KEYS } from '../config/react-query';
import { invalidateRelatedQueries, invalidateResourceDetail } from '../utils/queryInvalidator';
import type { ApiError } from '../types/api';

export const useOwners = (page = 1, limit = 12, search = '') => {
  return useQuery({
    queryKey: QUERY_KEYS.owners.list(JSON.stringify({ page, limit, search })),
    queryFn: () => ownersService.getOwners(page, limit, search),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useOwner = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.owners.detail(id),
    queryFn: () => ownersService.getOwnerById(id),
    enabled: !!id && !isNaN(id),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ownerData: CreateOwnerRequest) => ownersService.createOwner(ownerData),
    onSuccess: (response) => {
      invalidateRelatedQueries(queryClient, 'owners');
      toast.success(response.message || 'Proprietario creato con successo! 🎉');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || 'Errore durante la creazione del proprietario';
      toast.error(message, { id: 'owner-create-error' });
    },
  });
};

export const useUpdateOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOwnerRequest }) =>
      ownersService.updateOwner(id, data),
    onSuccess: (response) => {
      invalidateResourceDetail(queryClient, 'owners', response.data.id);
      toast.success(response.message || 'Proprietario aggiornato con successo! ✅');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || "Errore durante l'aggiornamento del proprietario";
      toast.error(message, { id: 'owner-update-error' });
    },
  });
};

export const useDeleteOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ownersService.deleteOwner(id),
    onSuccess: (response) => {
      invalidateRelatedQueries(queryClient, 'owners');
      toast.success(response.message || 'Proprietario eliminato con successo');
    },
    onError: (error: HandledAxiosError<ApiError>) => {
      if (error._isHandled) return;
      const message = getErrorMessage(error) || "Errore durante l'eliminazione del proprietario";
      toast.error(message, { id: 'owner-delete-error' });
    },
  });
};

/**
 * Pattern identico a useContracts:
 * - i parametri di paginazione entrano nella queryKey tramite JSON.stringify
 * - React Query tratta ogni combinazione di parametri come una entry separata in cache
 * - placeholderData evita il flash di contenuto vuoto tra una pagina e l'altra
 */
export const useOwnerContracts = (id: number, page = 1, limit = 12) => {
  return useQuery({
    queryKey: QUERY_KEYS.owners.contractsList(id, JSON.stringify({ page, limit })),
    queryFn: () => ownersService.getOwnerContracts(id, page, limit),
    enabled: !!id && !isNaN(id),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
};
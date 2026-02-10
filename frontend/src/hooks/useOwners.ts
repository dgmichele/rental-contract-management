import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ownersService from '../services/api/owners.service';
import type { CreateOwnerRequest, UpdateOwnerRequest } from '../types/owner';
import toast from 'react-hot-toast';

/**
 * HOOK - OTTIENI LISTA PROPRIETARI
 * Supporta paginazione e ricerca.
 */
export const useOwners = (page = 1, limit = 12, search = '') => {
  return useQuery({
    queryKey: ['owners', { page, limit, search }],
    queryFn: () => ownersService.getOwners(page, limit, search),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
};

/**
 * HOOK - OTTIENI SINGOLO PROPRIETARIO
 * Include le statistiche.
 */
export const useOwner = (id: number) => {
  return useQuery({
    queryKey: ['owner', id],
    queryFn: () => ownersService.getOwnerById(id),
    enabled: !!id && !isNaN(id),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * HOOK - CREA NUOVO PROPRIETARIO
 */
export const useCreateOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ownerData: CreateOwnerRequest) => ownersService.createOwner(ownerData),
    onSuccess: (response) => {
      // Invalida la lista per forzare il refresh
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      // Invalida anche le stats della dashboard visto che potrebbero cambiare
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success(response.message || 'Proprietario creato con successo! 🎉');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante la creazione del proprietario';
      toast.error(message);
    },
  });
};

/**
 * HOOK - AGGIORNA PROPRIETARIO ESISTENTE
 */
export const useUpdateOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOwnerRequest }) =>
      ownersService.updateOwner(id, data),
    onSuccess: (response) => {
      // Aggiorna la cache per il singolo owner e per la lista
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['owner', response.data.id] });
      
      toast.success(response.message || 'Proprietario aggiornato con successo! ✅');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Errore durante l'aggiornamento del proprietario";
      toast.error(message);
    },
  });
};

/**
 * HOOK - ELIMINA PROPRIETARIO
 */
export const useDeleteOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ownersService.deleteOwner(id),
    onSuccess: (response) => {
      // Invalida liste e stats
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success(response.message || 'Proprietario eliminato con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Errore durante l'eliminazione del proprietario";
      toast.error(message);
    },
  });
};

/**
 * HOOK - OTTIENI CONTRATTI DI UN PROPRIETARIO
 */
export const useOwnerContracts = (id: number, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['owner-contracts', id, { page, limit }],
    queryFn: () => ownersService.getOwnerContracts(id, page, limit),
    enabled: !!id && !isNaN(id),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
};

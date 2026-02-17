import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import * as contractsService from '../services/api/contracts.service';
import type {
  CreateContractRequest,
  UpdateContractRequest,
  RenewContractRequest,
  UpdateAnnuityRequest,
  ContractFilters,
} from '../types/contract';
import type { ApiError } from '../types/api';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Query keys per invalidazione cache
 */
const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters?: ContractFilters) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: number) => [...contractKeys.details(), id] as const,
  annuities: (id: number) => [...contractKeys.all, 'annuities', id] as const,
};

// ============= QUERY HOOKS =============

/**
 * Hook per ottenere lista contratti con filtri e paginazione
 * 
 * @param filters - Filtri opzionali (page, limit, ownerId, search, expiryMonth, expiryYear)
 * @returns Query con data paginata e stato loading/error
 * 
 * @example
 * const { data, isLoading, error } = useContracts({ page: 1, limit: 12, ownerId: 5 });
 */
export const useContracts = (filters?: ContractFilters) => {
  return useQuery({
    queryKey: contractKeys.list(filters),
    queryFn: () => contractsService.getContracts(filters),
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

/**
 * Hook per ottenere dettagli completi di un singolo contratto (include annuities)
 * 
 * @param id - ID del contratto
 * @param enabled - Se false, la query non viene eseguita (default: true)
 * @returns Query con contratto completo (owner, tenant, annuities)
 * 
 * @example
 * const { data: contract, isLoading } = useContract(5);
 */
export const useContract = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractsService.getContractById(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

/**
 * Hook per ottenere solo la timeline delle annuities di un contratto
 * 
 * @param id - ID del contratto
 * @param enabled - Se false, la query non viene eseguita (default: true)
 * @returns Query con array di annuities ordinate per anno
 * 
 * @example
 * const { data: annuities } = useContractAnnuities(5);
 */
export const useContractAnnuities = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: contractKeys.annuities(id),
    queryFn: () => contractsService.getContractAnnuities(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

// ============= MUTATION HOOKS =============

/**
 * Hook per creare un nuovo contratto
 * 
 * Genera automaticamente annuities se NON cedolare_secca
 * Se tenant_data fornito, crea nuovo tenant; altrimenti usa tenant_id esistente
 * 
 * @returns Mutation con funzione mutateAsync e stato loading/error
 * 
 * @example
 * const createContract = useCreateContract();
 * await createContract.mutateAsync({
 *   owner_id: 5,
 *   tenant_data: { name: 'Mario', surname: 'Rossi', phone: '123456789', email: 'mario@example.com' },
 *   start_date: '2024-01-15',
 *   end_date: '2028-01-15',
 *   cedolare_secca: false,
 *   typology: 'residenziale',
 *   canone_concordato: true,
 *   monthly_rent: 800,
 * });
 */
export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractRequest) => contractsService.createContract(data),
    onSuccess: (response) => {
      // Invalida cache lista contratti e dashboard
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success(response.message || 'Contratto creato con successo');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Hook per aggiornare un contratto esistente
 * 
 * Supporta anche aggiornamento dati tenant tramite tenant_data
 * Ricalcola automaticamente le due_date delle annualità se vengono modificate le date
 * 
 * @returns Mutation con funzione mutateAsync e stato loading/error
 * 
 * @example
 * const updateContract = useUpdateContract();
 * await updateContract.mutateAsync({
 *   id: 5,
 *   data: { monthly_rent: 850, tenant_data: { phone: '987654321' } }
 * });
 */
export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContractRequest }) =>
      contractsService.updateContract(id, data),
    onSuccess: (response, variables) => {
      // Invalida cache contratto specifico, lista e dashboard
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success(response.message || 'Contratto aggiornato con successo');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Hook per rinnovare un contratto esistente
 * 
 * Mantiene owner/tenant, aggiorna condizioni
 * Operazioni eseguite dal backend:
 * 1. Elimina vecchie annuities
 * 2. Aggiorna contratto con nuove date e condizioni
 * 3. Setta last_annuity_paid = anno start_date
 * 4. Rigenera annuities (se NON cedolare_secca)
 * 
 * @returns Mutation con funzione mutateAsync e stato loading/error
 * 
 * @example
 * const renewContract = useRenewContract();
 * await renewContract.mutateAsync({
 *   id: 5,
 *   data: {
 *     start_date: '2028-01-15',
 *     end_date: '2032-01-15',
 *     cedolare_secca: false,
 *     typology: 'residenziale',
 *     canone_concordato: true,
 *     monthly_rent: 950,
 *   }
 * });
 */
export const useRenewContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RenewContractRequest }) =>
      contractsService.renewContract(id, data),
    onSuccess: (response, variables) => {
      // Invalida cache contratto specifico, lista e dashboard
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.annuities(variables.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success(response.message || 'Contratto rinnovato con successo');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Hook per aggiornare annualità successiva
 * 
 * Operazioni eseguite dal backend:
 * 1. Aggiorna contract.last_annuity_paid = <anno>
 * 2. Aggiorna annuity (contract_id, <anno>) -> is_paid = true, paid_at = NOW
 * 
 * @returns Mutation con funzione mutateAsync e stato loading/error
 * 
 * @example
 * const updateAnnuity = useUpdateContractAnnuity();
 * await updateAnnuity.mutateAsync({
 *   id: 5,
 *   data: { last_annuity_paid: 2026 }
 * });
 */
export const useUpdateContractAnnuity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnnuityRequest }) =>
      contractsService.updateContractAnnuity(id, data),
    onSuccess: (response, variables) => {
      // Invalida cache contratto specifico, annuities, lista e dashboard
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.annuities(variables.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success(response.message || 'Annualità aggiornata con successo');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Hook per eliminare un contratto (CASCADE annuities)
 * 
 * @returns Mutation con funzione mutateAsync e stato loading/error
 * 
 * @example
 * const deleteContract = useDeleteContract();
 * await deleteContract.mutateAsync(5);
 */
export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contractsService.deleteContract(id),
    onSuccess: (_, deletedId) => {
      // Invalida cache contratto specifico, lista e dashboard
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success('Contratto eliminato con successo');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

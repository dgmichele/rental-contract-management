import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import contractsService from '../services/api/contracts.service';
import toast from 'react-hot-toast';

export const useContracts = (filters: any) => {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => contractsService.getContracts(filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useContract = (id: number) => {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractsService.getContractById(id),
    enabled: !!id,
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contractsService.deleteContract(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['owner-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expiring'] });
      
      toast.success(response.message || 'Contratto eliminato con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Errore durante l'eliminazione del contratto";
      toast.error(message);
    },
  });
};

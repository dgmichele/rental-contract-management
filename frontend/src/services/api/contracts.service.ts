import api from './axios.config';
import type { ContractWithRelations } from '../../types/shared';

export interface ContractsResponse {
  success: boolean;
  data: ContractWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleContractResponse {
  success: boolean;
  data: ContractWithRelations;
}

const contractsService = {
  getContracts: async (params: any): Promise<ContractsResponse> => {
    const { data } = await api.get<ContractsResponse>('/contract', { params });
    return data;
  },

  getContractById: async (id: number): Promise<SingleContractResponse> => {
    const { data } = await api.get<SingleContractResponse>(`/contract/${id}`);
    return data;
  },

  deleteContract: async (id: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/contract/${id}`);
    return data;
  },
};

export default contractsService;

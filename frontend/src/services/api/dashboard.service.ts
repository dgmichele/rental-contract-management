import api from './axios.config';
import type { 
  DashboardStatsResponse, 
  GetExpiringContractsQuery, 
  ExpiringContractsResponse 
} from '../../types/dashboard';

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await api.get<{ success: boolean; data: DashboardStatsResponse }>('/dashboard/stats');
    return response.data.data;
  },

  getExpiringContracts: async (params: GetExpiringContractsQuery): Promise<ExpiringContractsResponse> => {
    const response = await api.get<ExpiringContractsResponse>('/dashboard/expiring-contracts', {
      params,
    });
    return response.data;
  },
};

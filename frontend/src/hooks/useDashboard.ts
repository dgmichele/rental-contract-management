import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api/dashboard.service';
import type { GetExpiringContractsQuery } from '../types/dashboard';
import { QUERY_KEYS } from '../config/react-query';

export const useStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: dashboardService.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useExpiringContracts = (params: GetExpiringContractsQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.expiring(JSON.stringify(params)),
    queryFn: () => dashboardService.getExpiringContracts(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

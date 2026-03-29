import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export const QUERY_KEYS = {
  contracts: {
    all: ['contracts'] as const,
    lists: () => [...QUERY_KEYS.contracts.all, 'list'] as const,
    list: (filters: string) => [...QUERY_KEYS.contracts.lists(), filters] as const,
    details: () => [...QUERY_KEYS.contracts.all, 'detail'] as const,
    detail: (id: number) => [...QUERY_KEYS.contracts.details(), id] as const,
    annuities: (id: number) => [...QUERY_KEYS.contracts.detail(id), 'annuities'] as const,
  },

  owners: {
    all: ['owners'] as const,
    lists: () => [...QUERY_KEYS.owners.all, 'list'] as const,
    list: (filters: string) => [...QUERY_KEYS.owners.lists(), filters] as const,
    details: () => [...QUERY_KEYS.owners.all, 'detail'] as const,
    detail: (id: number) => [...QUERY_KEYS.owners.details(), id] as const,
    // contracts ora include i parametri di paginazione, come il pattern di contracts.list
    contracts: (id: number) => [...QUERY_KEYS.owners.detail(id), 'contracts'] as const,
    contractsList: (id: number, filters: string) =>
      [...QUERY_KEYS.owners.contracts(id), filters] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
    expiringLists: () => [...QUERY_KEYS.dashboard.all, 'expiring'] as const,
    expiring: (filters: string) => [...QUERY_KEYS.dashboard.expiringLists(), filters] as const,
  },

  user: {
    me: ['user', 'me'] as const,
  },
} as const;
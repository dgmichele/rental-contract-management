import { QueryClient } from '@tanstack/react-query';

/**
 * Configurazione globale React Query Client.
 * Definisce comportamento default per cache, retry e refetch.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache valida per 5 minuti
      staleTime: 1000 * 60 * 5,
      
      // Cache mantenuta in memoria per 10 minuti
      gcTime: 1000 * 60 * 10,
      
      // Retry automatico una volta in caso di errore
      retry: 1,
      
      // NON refetch automatico quando la finestra torna in focus
      refetchOnWindowFocus: false,
      
      // NON refetch automatico quando si riconnette
      refetchOnReconnect: false,
    },
  },
});

/**
 * QUERY KEYS - Struttura gerarchica per gestione cache React Query.
 * 
 * Pattern:
 * - all: ['resource'] - invalida tutto
 * - lists: ['resource', 'list'] - invalida tutte le liste
 * - list: ['resource', 'list', filters] - invalida lista specifica
 * - details: ['resource', 'detail'] - invalida tutti i dettagli
 * - detail: ['resource', 'detail', id] - invalida dettaglio specifico
 */
export const QUERY_KEYS = {
  // ============= CONTRACTS =============
  contracts: {
    all: ['contracts'] as const,
    lists: () => [...QUERY_KEYS.contracts.all, 'list'] as const,
    list: (filters: string) => [...QUERY_KEYS.contracts.lists(), filters] as const,
    details: () => [...QUERY_KEYS.contracts.all, 'detail'] as const,
    detail: (id: number) => [...QUERY_KEYS.contracts.details(), id] as const,
    annuities: (id: number) => [...QUERY_KEYS.contracts.detail(id), 'annuities'] as const,
  },

  // ============= OWNERS =============
  owners: {
    all: ['owners'] as const,
    lists: () => [...QUERY_KEYS.owners.all, 'list'] as const,
    list: (filters: string) => [...QUERY_KEYS.owners.lists(), filters] as const,
    details: () => [...QUERY_KEYS.owners.all, 'detail'] as const,
    detail: (id: number) => [...QUERY_KEYS.owners.details(), id] as const,
    contracts: (id: number) => [...QUERY_KEYS.owners.detail(id), 'contracts'] as const,
  },

  // ============= DASHBOARD =============
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    expiring: (period: string, page: number) => ['dashboard', 'expiring', period, page] as const,
  },

  // ============= USER =============
  user: {
    me: ['user', 'me'] as const,
  },
} as const;

/**
 * Esempio di utilizzo nei custom hooks:
 * 
 * useQuery({
 *   queryKey: QUERY_KEYS.contracts.list(JSON.stringify(filters)),
 *   queryFn: () => contractsService.getAll(filters),
 * });
 * 
 * queryClient.invalidateQueries({ 
 *   queryKey: QUERY_KEYS.contracts.all 
 * }); // Invalida TUTTI i contracts (liste + dettagli)
 */
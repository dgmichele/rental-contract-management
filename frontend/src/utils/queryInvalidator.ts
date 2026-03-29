import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/react-query';

export const invalidateRelatedQueries = (
  queryClient: QueryClient,
  resource: 'contracts' | 'owners' | 'dashboard' | 'user'
) => {
  switch (resource) {
    case 'contracts':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.all });
      break;

    case 'owners':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      break;

    case 'dashboard':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all });
      break;

    case 'user':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      break;
  }
};

/**
 * Invalida singola risorsa per ID e le sue liste correlate.
 *
 * Per gli owner contracts: invalidando QUERY_KEYS.owners.contracts(id)
 * React Query invalida per prefisso, coprendo automaticamente tutte le
 * entry di contractsList(id, *) generate dalla paginazione.
 */
export const invalidateResourceDetail = (
  queryClient: QueryClient,
  resource: 'contracts' | 'owners',
  id: number
) => {
  if (resource === 'contracts') {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.detail(id) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.annuities(id) });
    invalidateRelatedQueries(queryClient, 'contracts');
  } else if (resource === 'owners') {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.detail(id) });
    // Invalida tutti i contratti paginati di questo owner (prefisso match)
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.contracts(id) });
    invalidateRelatedQueries(queryClient, 'owners');
  }
};
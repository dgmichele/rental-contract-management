import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/react-query';

/**
 * Utility per invalidare selettivamente o massivamente la cache di React Query.
 * Previene la duplicazione della logica di invalidazione nei mutation hooks.
 */
export const invalidateRelatedQueries = (queryClient: QueryClient, resource: 'contracts' | 'owners' | 'dashboard' | 'user') => {
  switch (resource) {
    case 'contracts':
      // Quando un contratto cambia, invalidiamo:
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all }); // Liste e dettagli
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats }); // KPI dashboard
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.all }); // I proprietari potrebbero avere stats aggiornate
      break;
      
    case 'owners':
      // Quando un proprietario cambia, invalidiamo:
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
      // Se cambiano i dati del proprietario, i contratti associati potrebbero rifletterlo
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      break;
      
    case 'dashboard':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
      break;
      
    case 'user':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      break;
  }
};

/**
 * Invalida singola risorsa per ID e le sue liste correlate
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
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owners.contracts(id) });
    invalidateRelatedQueries(queryClient, 'owners');
  }
};

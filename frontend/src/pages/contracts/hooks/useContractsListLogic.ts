import { useEffect, useRef, useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { useDeleteContract } from '../../../hooks/useContracts';
import type { ContractWithRelations } from '../../../types/shared';

interface State {
  isDeleteModalOpen: boolean;
  isFiltersModalOpen: boolean;
  openedViaSticky: boolean;
  selectedContract: ContractWithRelations | null;
  showStickyFilter: boolean;
}

type Action =
  | { type: 'OPEN_DELETE_MODAL'; payload: ContractWithRelations }
  | { type: 'CLOSE_DELETE_MODAL' }
  | { type: 'OPEN_FILTERS_MODAL'; openedViaSticky: boolean }
  | { type: 'CLOSE_FILTERS_MODAL' }
  | { type: 'SET_SHOW_STICKY_FILTER'; payload: boolean };

const initialState: State = {
  isDeleteModalOpen: false,
  isFiltersModalOpen: false,
  openedViaSticky: false,
  selectedContract: null,
  showStickyFilter: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: true, selectedContract: action.payload };
    case 'CLOSE_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: false, selectedContract: null };
    case 'OPEN_FILTERS_MODAL':
      return { ...state, isFiltersModalOpen: true, openedViaSticky: action.openedViaSticky };
    case 'CLOSE_FILTERS_MODAL':
      return { ...state, isFiltersModalOpen: false };
    case 'SET_SHOW_STICKY_FILTER':
      return { ...state, showStickyFilter: action.payload };
    default:
      return state;
  }
}

export const useContractsListLogic = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const page = Number(searchParams.get('page')) || 1;
  const setPage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: true });
  };

  const search = searchParams.get('search') || '';
  const setSearch = (newSearch: string) => {
    setSearchParams(prev => {
      if (newSearch) prev.set('search', newSearch);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const debouncedSearch = useDebounce(search, 400);

  const filters = {
    expiryMonth: searchParams.get('expiryMonth') ? Number(searchParams.get('expiryMonth')) : undefined,
    expiryYear: searchParams.get('expiryYear') ? Number(searchParams.get('expiryYear')) : undefined,
  };
  
  const setFilters = (newFilters: { expiryMonth?: number; expiryYear?: number }) => {
    setSearchParams(prev => {
      if (newFilters.expiryMonth !== undefined) prev.set('expiryMonth', newFilters.expiryMonth.toString());
      else prev.delete('expiryMonth');
      
      if (newFilters.expiryYear !== undefined) prev.set('expiryYear', newFilters.expiryYear.toString());
      else prev.delete('expiryYear');
      
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const hasActiveFilters = filters.expiryMonth !== undefined || filters.expiryYear !== undefined;

  const deleteContractMutation = useDeleteContract();

  const confirmDelete = async () => {
    if (state.selectedContract) {
      await deleteContractMutation.mutateAsync(state.selectedContract.id);
      dispatch({ type: 'CLOSE_DELETE_MODAL' });
    }
  };

  const handleApplyFilters = (newFilters: { expiryMonth?: number; expiryYear?: number }) => {
    setFilters(newFilters);
    dispatch({ type: 'CLOSE_FILTERS_MODAL' });
    
    if (state.openedViaSticky) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (searchContainerRef.current) {
        const rect = searchContainerRef.current.getBoundingClientRect();
        dispatch({ type: 'SET_SHOW_STICKY_FILTER', payload: rect.bottom < 0 });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    state,
    dispatch,
    searchParams: { page, setPage, search, setSearch, debouncedSearch, filters, setFilters, hasActiveFilters },
    searchContainerRef,
    deleteContractMutation,
    confirmDelete,
    handleApplyFilters
  };
};

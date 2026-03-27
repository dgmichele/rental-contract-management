import { useRef, useEffect, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeleteContract } from '../../../hooks/useContracts';
import type { ContractWithRelations } from '../../../types/shared';

interface State {
  isEditModalOpen: boolean;
  isDeleteContractModalOpen: boolean;
  selectedContract: ContractWithRelations | null;
  isMobile: boolean;
}

type Action =
  | { type: 'OPEN_EDIT_MODAL' }
  | { type: 'CLOSE_EDIT_MODAL' }
  | { type: 'OPEN_DELETE_CONTRACT_MODAL'; payload: ContractWithRelations }
  | { type: 'CLOSE_DELETE_CONTRACT_MODAL' }
  | { type: 'SET_IS_MOBILE'; payload: boolean };

const getInitialState = (): State => ({
  isEditModalOpen: false,
  isDeleteContractModalOpen: false,
  selectedContract: null,
  isMobile: window.matchMedia('(max-width: 600px)').matches,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_EDIT_MODAL':
      return { ...state, isEditModalOpen: true };
    case 'CLOSE_EDIT_MODAL':
      return { ...state, isEditModalOpen: false };
    case 'OPEN_DELETE_CONTRACT_MODAL':
      return { ...state, isDeleteContractModalOpen: true, selectedContract: action.payload };
    case 'CLOSE_DELETE_CONTRACT_MODAL':
      return { ...state, isDeleteContractModalOpen: false, selectedContract: null };
    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload };
    default:
      return state;
  }
}

export const useOwnerDetailLogic = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const contractsSectionRef = useRef<HTMLHeadingElement>(null);
  const deleteContractMutation = useDeleteContract();

  const page = Number(searchParams.get('page')) || 1;
  const setPage = (newPage: number) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: true });
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handler = (e: MediaQueryListEvent) => dispatch({ type: 'SET_IS_MOBILE', payload: e.matches });
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const confirmDeleteContract = async () => {
    if (state.selectedContract) {
      await deleteContractMutation.mutateAsync(state.selectedContract.id);
      dispatch({ type: 'CLOSE_DELETE_CONTRACT_MODAL' });
    }
  };

  const handleBack = () => navigate(-1);

  return {
    state,
    dispatch,
    page,
    setPage,
    contractsSectionRef,
    handlers: {
      confirmDeleteContract,
      handleBack,
    },
    mutations: {
      deleteContractMutation
    }
  };
};

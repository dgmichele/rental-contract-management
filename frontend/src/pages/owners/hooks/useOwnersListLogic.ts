import { useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOwners, useDeleteOwner } from '../../../hooks/useOwners';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Owner } from '../../../types/owner';

interface State {
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isViewModalOpen: boolean;
  selectedOwner: Owner | null;
}

type Action =
  | { type: 'OPEN_ADD_MODAL' }
  | { type: 'CLOSE_ADD_MODAL' }
  | { type: 'OPEN_EDIT_MODAL'; owner: Owner }
  | { type: 'CLOSE_EDIT_MODAL' }
  | { type: 'OPEN_DELETE_MODAL'; owner: Owner }
  | { type: 'CLOSE_DELETE_MODAL' }
  | { type: 'OPEN_VIEW_MODAL'; owner: Owner }
  | { type: 'CLOSE_VIEW_MODAL' }
  | { type: 'CLEAR_SELECTED_OWNER' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'OPEN_ADD_MODAL':
      return { ...state, isAddModalOpen: true };
    case 'CLOSE_ADD_MODAL':
      return { ...state, isAddModalOpen: false };
    case 'OPEN_EDIT_MODAL':
      return { ...state, isEditModalOpen: true, selectedOwner: action.owner };
    case 'CLOSE_EDIT_MODAL':
      return { ...state, isEditModalOpen: false };
    case 'OPEN_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: true, selectedOwner: action.owner };
    case 'CLOSE_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: false };
    case 'OPEN_VIEW_MODAL':
      return { ...state, isViewModalOpen: true, selectedOwner: action.owner };
    case 'CLOSE_VIEW_MODAL':
      return { ...state, isViewModalOpen: false };
    case 'CLEAR_SELECTED_OWNER':
      if (state.isEditModalOpen || state.isViewModalOpen || state.isDeleteModalOpen) return state;
      return { ...state, selectedOwner: null };
    default:
      return state;
  }
};

export const useOwnersListLogic = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, {
    isAddModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    isViewModalOpen: false,
    selectedOwner: null,
  });

  // Pagination & Search
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const debouncedSearch = useDebounce(search, 400);

  const setPage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: true });
  };

  const setSearch = (newSearch: string) => {
    setSearchParams(prev => {
      if (newSearch) prev.set('search', newSearch);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  // Queries
  const ownersQuery = useOwners(page, 12, debouncedSearch);
  const deleteOwnerMutation = useDeleteOwner();

  // Handlers
  const handleEdit = (owner: Owner) => dispatch({ type: 'OPEN_EDIT_MODAL', owner });
  const handleDelete = (owner: Owner) => dispatch({ type: 'OPEN_DELETE_MODAL', owner });
  const handleView = (owner: Owner) => dispatch({ type: 'OPEN_VIEW_MODAL', owner });
  const clearSelectedOwner = () => dispatch({ type: 'CLEAR_SELECTED_OWNER' });

  const confirmDelete = async () => {
    if (state.selectedOwner) {
      await deleteOwnerMutation.mutateAsync(state.selectedOwner.id);
      dispatch({ type: 'CLOSE_DELETE_MODAL' });
      dispatch({ type: 'CLEAR_SELECTED_OWNER' });
    }
  };

  return {
    ...state,
    page,
    search,
    setPage,
    setSearch,
    ownersQuery,
    deleteOwnerMutation,
    handleEdit,
    handleDelete,
    handleView,
    clearSelectedOwner,
    confirmDelete,
    setIsAddModalOpen: (isOpen: boolean) => dispatch({ type: isOpen ? 'OPEN_ADD_MODAL' : 'CLOSE_ADD_MODAL' }),
    setIsEditModalOpen: (isOpen: boolean) => {
      if (isOpen) {
        if (state.selectedOwner) dispatch({ type: 'OPEN_EDIT_MODAL', owner: state.selectedOwner });
      } else {
        dispatch({ type: 'CLOSE_EDIT_MODAL' });
      }
    },
    setIsViewModalOpen: (isOpen: boolean) => {
      if (isOpen) {
        if (state.selectedOwner) dispatch({ type: 'OPEN_VIEW_MODAL', owner: state.selectedOwner });
      } else {
        dispatch({ type: 'CLOSE_VIEW_MODAL' });
      }
    },
    setIsDeleteModalOpen: (isOpen: boolean) => {
      if (isOpen) {
        if (state.selectedOwner) dispatch({ type: 'OPEN_DELETE_MODAL', owner: state.selectedOwner });
      } else {
        dispatch({ type: 'CLOSE_DELETE_MODAL' });
      }
    },
  };
};

import { useReducer } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useCreateContract, 
  useUpdateContract, 
  useDeleteContract,
  useRenewContract,
  useUpdateContractAnnuity
} from '../../../hooks/useContracts';
import type { ContractFormData } from '../../../components/forms/ContractForm';
import type { ContractWithRelations } from '../../../types/shared';

interface State {
  isDeleteModalOpen: boolean;
  isAnnuityModalOpen: boolean;
  isRenewModalOpen: boolean;
  renewFormData: ContractFormData | null;
}

type Action =
  | { type: 'OPEN_DELETE_MODAL' }
  | { type: 'CLOSE_DELETE_MODAL' }
  | { type: 'OPEN_ANNUITY_MODAL' }
  | { type: 'CLOSE_ANNUITY_MODAL' }
  | { type: 'OPEN_RENEW_MODAL'; payload: ContractFormData }
  | { type: 'CLOSE_RENEW_MODAL' };

const initialState: State = {
  isDeleteModalOpen: false,
  isAnnuityModalOpen: false,
  isRenewModalOpen: false,
  renewFormData: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: true };
    case 'CLOSE_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: false };
    case 'OPEN_ANNUITY_MODAL':
      return { ...state, isAnnuityModalOpen: true };
    case 'CLOSE_ANNUITY_MODAL':
      return { ...state, isAnnuityModalOpen: false };
    case 'OPEN_RENEW_MODAL':
      return { ...state, isRenewModalOpen: true, renewFormData: action.payload };
    case 'CLOSE_RENEW_MODAL':
      return { ...state, isRenewModalOpen: false, renewFormData: null };
    default:
      return state;
  }
}

export const useContractDetailLogic = (
  contract: ContractWithRelations | undefined,
  mode: 'view' | 'edit' | 'renew' | 'annuity' | 'add',
  nextAnnuityYear: number
) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(reducer, initialState);

  // Mutations
  const createContractMutation = useCreateContract();
  const updateContractMutation = useUpdateContract();
  const deleteContractMutation = useDeleteContract();
  const renewContractMutation = useRenewContract();
  const updateAnnuityMutation = useUpdateContractAnnuity();

  const isSaving = createContractMutation.isPending || 
                   updateContractMutation.isPending || 
                   renewContractMutation.isPending;

  const handleSubmit = async (data: ContractFormData) => {
    try {
      if (mode === 'add') {
        const result = await createContractMutation.mutateAsync({
          ...data,
          last_annuity_paid: data.last_annuity_paid,
        });
        
        if (result?.data?.id) {
          navigate(`/contracts/${result.data.id}?mode=view`, { 
            state: { ...location.state, justSaved: true },
            replace: true 
          });
        } else {
          navigate(-1);
        }
      } else if (mode === 'edit' && contract) {
        await updateContractMutation.mutateAsync({
          id: contract.id,
          data: {
            ...data,
          },
        });
        
        if (location.state?.fromView) {
          navigate(-1);
        } else {
          navigate(`/contracts/${contract.id}?mode=view`, { 
            state: { ...location.state, justSaved: true },
            replace: true 
          });
        }
      } else if (mode === 'renew' && contract) {
        dispatch({ type: 'OPEN_RENEW_MODAL', payload: data });
      }
    } catch (error) {
      console.error("Errore salvataggio contratto:", error);
    }
  };

  const handleDelete = async () => {
    if (contract) {
      await deleteContractMutation.mutateAsync(contract.id);
      dispatch({ type: 'CLOSE_DELETE_MODAL' });
      navigate(-1);
    }
  };

  const handleRenewConfirm = async () => {
    if (!contract || !state.renewFormData) return;
    try {
      await renewContractMutation.mutateAsync({
        id: contract.id,
        data: {
          start_date: state.renewFormData.start_date,
          end_date: state.renewFormData.end_date,
          cedolare_secca: state.renewFormData.cedolare_secca,
          typology: state.renewFormData.typology,
          canone_concordato: state.renewFormData.canone_concordato,
          monthly_rent: state.renewFormData.monthly_rent,
        },
      });
      dispatch({ type: 'CLOSE_RENEW_MODAL' });
      
      if (location.state?.fromView) {
        navigate(-1);
      } else {
        navigate(`/contracts/${contract.id}?mode=view`, { 
          state: { ...location.state, justSaved: true },
          replace: true 
        });
      }
    } catch (error) {
      console.error("Errore rinnovo contratto:", error);
    }
  };

  const handleAnnuityConfirm = async () => {
    if (!contract) return;
    try {
      await updateAnnuityMutation.mutateAsync({
        id: contract.id,
        data: {
          last_annuity_paid: nextAnnuityYear,
        },
      });
      dispatch({ type: 'CLOSE_ANNUITY_MODAL' });
      
      if (location.state?.fromView) {
        navigate(-1);
      } else {
        navigate(`/contracts/${contract.id}?mode=view`, { 
          state: { ...location.state, justSaved: true },
          replace: true 
        });
      }
    } catch (error) {
      console.error("Errore aggiornamento annualità:", error);
    }
  };

  return {
    state,
    dispatch,
    isSaving,
    mutations: {
      deleteContractMutation,
      renewContractMutation,
      updateAnnuityMutation
    },
    handlers: {
      handleSubmit,
      handleDelete,
      handleRenewConfirm,
      handleAnnuityConfirm
    }
  };
};

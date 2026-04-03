import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  FaArrowLeft, 
  FaInfoCircle
} from 'react-icons/fa';
import { useContract } from '../../hooks/useContracts';
import { useOwners } from '../../hooks/useOwners';
import { useContractDetailLogic } from './hooks/useContractDetailLogic';
import { ContractViewMode } from './components/ContractViewMode';
import { AnnuityTimeline } from '../../components/timeline/AnnuityTimeline';
import ContractForm from '../../components/forms/ContractForm';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import DeleteModal from '../../components/modals/DeleteModal';
import ConfirmAnnuityModal from '../../components/modals/ConfirmAnnuityModal';
import ConfirmRenewModal from '../../components/modals/ConfirmRenewModal';

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const modeParam = searchParams.get('mode');
  const isNew = !id;
  const mode = isNew ? 'add' : (modeParam as 'view' | 'edit' | 'renew' | 'annuity' || 'view');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [mode, location.state?.justSaved]);

  const preselectedOwnerId = location.state?.ownerId;

  const { data: contractData, isLoading: isContractLoading, error: contractError } = useContract(Number(id), !isNew);
  const { data: ownersData, isLoading: isOwnersLoading } = useOwners(1, 100); 
  
  const contract = contractData?.data;
  const owners = ownersData?.data || [];
  const nextAnnuityYear = contract?.last_annuity_paid 
    ? contract.last_annuity_paid + 1 
    : contract ? dayjs(contract.start_date).year() + 1 : 0;
  
  const isLoading = isContractLoading || (isNew && isOwnersLoading);

  const {
    state,
    dispatch,
    isSaving,
    mutations,
    handlers
  } = useContractDetailLogic(contract, mode, nextAnnuityYear);

  if (!isNew && !isLoading && (contractError || !contract)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-text-title">Contratto non trovato 😰</h2>
        <Button variant="primary" onClick={() => navigate('/contracts')} className="mt-4">
          Torna alla lista
        </Button>
      </div>
    );
  }

  const getBackLabel = () => mode === 'view' ? 'Torna indietro' : 'Annulla e torna indietro';

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-semibold cursor-pointer mb-4"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        {getBackLabel()}
      </button>

      {isLoading ? (
        <div className="space-y-8 max-w-5xl mx-auto">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : mode === 'view' && contract ? (
        <ContractViewMode contract={contract} onDeleteClick={() => dispatch({ type: 'OPEN_DELETE_MODAL' })} />
      ) : (
        <div className="max-w-3xl mx-auto bg-bg-card p-6 sm:p-8 rounded-xl border border-border shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-heading text-text-title mb-2">
            {mode === 'add' ? 'Nuovo contratto' : 
             mode === 'edit' ? 'Modifica contratto' : 
             mode === 'renew' ? 'Rinnova contratto' : 
             mode === 'annuity' ? 'Rinnova annualità' : ''}
          </h1>
          {contract && (mode === 'renew' || mode === 'annuity') && (
            <p className="text-text-subtle mb-8 font-medium">
              Contratto tra {contract.owner.name} {contract.owner.surname} e {contract.tenant.name} {contract.tenant.surname}
            </p>
          )}

          {mode === 'renew' && (
             <div className="flex items-start gap-3 bg-bg-card p-3 rounded-lg mb-8 border border-secondary">
                <span className="text-2xl shrink-0 text-secondary"><FaInfoCircle /></span>
                <p className="text-sm text-text-title leading-relaxed font-medium">
                  Rinnova il contratto inserendo la nuova data di inizio e di scadenza. Puoi anche modificare altri dati se le condizioni contrattuali hanno subito cambiamenti.
                </p>
             </div>
          )}

          {mode === 'annuity' ? (
            <>
              {contract && !contract.cedolare_secca && dayjs(contract.start_date).year() !== dayjs(contract.end_date).year() && (
                <div className="mb-8">
                  <AnnuityTimeline 
                    annuities={contract?.annuities || []}
                    contractStartYear={dayjs(contract.start_date).year()}
                    contractEndYear={dayjs(contract.end_date).year()}
                    isMobileScrollable={true}
                  />
                </div>
              )}
              <Button
                variant="primary"
                className="w-full"
                onClick={() => dispatch({ type: 'OPEN_ANNUITY_MODAL' })}
                isLoading={mutations.updateAnnuityMutation.isPending}
              >
                Conferma rinnovo annualità
              </Button>
            </>
          ) : (
            <ContractForm
              mode={mode === 'add' ? 'create' : (mode as 'edit' | 'renew' | 'annuity')}
              initialData={contract ? {
                ...contract,
                start_date: contract.start_date ? dayjs(contract.start_date).format('YYYY-MM-DD') : '',
                end_date: contract.end_date ? dayjs(contract.end_date).format('YYYY-MM-DD') : '',
                last_annuity_paid: contract.last_annuity_paid,
                tenant_data: {
                  name: contract.tenant.name,
                  surname: contract.tenant.surname,
                  phone: contract.tenant.phone || '',
                  email: contract.tenant.email || '',
                }
              } : undefined}
              owners={owners}
              preselectedOwnerId={preselectedOwnerId}
              allowOwnerChange={mode === 'add' && !preselectedOwnerId}
              minAnnuityYear={contract 
                ? (mode === 'edit' 
                  ? dayjs(contract.start_date).year()
                  : (mode === 'renew'
                    ? Math.max(contract.last_annuity_paid || 0, dayjs().year())
                    : (contract.last_annuity_paid ? contract.last_annuity_paid + 1 : dayjs(contract.start_date).year() + 1)))
                : 2000
              }
              onSubmit={handlers.handleSubmit}
              isLoading={isSaving}
              submitLabel={
                mode === 'add' ? 'Aggiungi contratto' : 
                mode === 'renew' ? 'Conferma rinnovo' :
                'Salva modifiche'
              }
              onDelete={mode === 'edit' ? () => dispatch({ type: 'OPEN_DELETE_MODAL' }) : undefined}
            />
          )}
        </div>
      )}

      {contract && (
        <DeleteModal
          isOpen={state.isDeleteModalOpen}
          onClose={() => dispatch({ type: 'CLOSE_DELETE_MODAL' })}
          onConfirm={handlers.handleDelete}
          title="Elimina contratto"
          message={`Sei sicuro di voler eliminare il contratto tra ${contract.owner.name} ${contract.owner.surname} e ${contract.tenant.name} ${contract.tenant.surname}? L'operazione sarà irreversibile.`}
          isLoading={mutations.deleteContractMutation.isPending}
        />
      )}

      <ConfirmAnnuityModal
        isOpen={state.isAnnuityModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_ANNUITY_MODAL' })}
        onConfirm={handlers.handleAnnuityConfirm}
        annuityYear={nextAnnuityYear}
        isLoading={mutations.updateAnnuityMutation.isPending}
      />

      <ConfirmRenewModal
        isOpen={state.isRenewModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_RENEW_MODAL' })}
        onConfirm={handlers.handleRenewConfirm}
        newStartDate={state.renewFormData?.start_date}
        newEndDate={state.renewFormData?.end_date}
        isLoading={mutations.renewContractMutation.isPending}
      />
    </div>
  );
};

export default ContractDetailPage;

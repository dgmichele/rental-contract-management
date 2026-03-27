import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaFileContract, FaEuroSign, FaPlusCircle } from 'react-icons/fa';
import { useOwner, useOwnerContracts } from '../../hooks/useOwners';
import { useOwnerDetailLogic } from './hooks/useOwnerDetailLogic';
import { StatsCard } from '../../components/cards/StatsCard';
import { ContractCard } from '../../components/cards/ContractCard';
import { ContractCardSkeleton } from '../../components/cards/ContractCardSkeleton';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import EditOwnerModal from '../../components/modals/EditOwnerModal';
import DeleteModal from '../../components/modals/DeleteModal';
import type { ContractWithRelations } from '../../types/shared';
import Skeleton from '../../components/ui/Skeleton';
import { StatsCardSkeleton } from '../../components/cards/StatsCardSkeleton';
import { formatCurrency } from '../../utils/format';

const OwnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ownerId = Number(id);
  const location = useLocation();

  const {
    state,
    dispatch,
    page,
    setPage,
    contractsSectionRef,
    handlers: { confirmDeleteContract, handleBack },
    mutations: { deleteContractMutation }
  } = useOwnerDetailLogic();

  const { data: ownerData, isLoading: isOwnerLoading, error: ownerError } = useOwner(ownerId);
  const { data: contractsData, isLoading: isContractsLoading } = useOwnerContracts(ownerId, page, 12);

  if (!isOwnerLoading && (ownerError || !ownerData?.success)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-text-title">Proprietario non trovato 😰</h2>
        <Button variant="primary" onClick={() => navigate('/owners')} className="mt-4">
          Torna alla lista
        </Button>
      </div>
    );
  }

  const owner = ownerData?.data;

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-semibold cursor-pointer"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Torna indietro
        </button>
      </div>

      {/* Header with Title and Edit and Add Contract */}
      <div className="flex items-center gap-6 flex-wrap">
        <h1 className="text-3xl font-heading text-text-title">
          {isOwnerLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            `${owner?.name} ${owner?.surname}`
          )}
        </h1>
        <div className="flex items-center gap-1">
          {!isOwnerLoading && (
            <>
              <button
                onClick={() => dispatch({ type: 'OPEN_EDIT_MODAL' })}
                className="text-secondary hover:text-primary transition-all active:scale-95 flex items-center justify-center p-1 cursor-pointer" 
                title="Modifica proprietario"
              >
                <FaEdit size={24} />
              </button>
              <button
                onClick={() => navigate('/contracts/new', { state: { ownerId: owner?.id, returnUrl: window.location.pathname + window.location.search } })}
                className="text-secondary hover:text-primary transition-all active:scale-95 flex items-center justify-center p-1 cursor-pointer"
                title="Aggiungi contratto"
              >
                <FaPlusCircle size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex flex-col sm:flex-row gap-6">
        {isOwnerLoading ? (
          <>
            <StatsCardSkeleton className="w-full sm:w-72" />
            <StatsCardSkeleton className="w-full sm:w-72" />
          </>
        ) : owner && (
          <>
            <StatsCard
              label="Contratti attivi"
              value={owner.stats.total_contracts}
              icon={<FaFileContract />}
              className="w-full sm:w-72"
            />
            <StatsCard
              label="Canone mensile totale"
              value={formatCurrency(owner.stats.total_monthly_rent)}
              icon={<FaEuroSign />}
              className="w-full sm:w-72"
            />
          </>
        )}
      </div>

      {/* Contracts Grid */}
      <div className="space-y-6">
        <h2 ref={contractsSectionRef} className="text-2xl font-bold text-text-title pb-2">
          Contratti associati:
        </h2>

        {isContractsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ContractCardSkeleton key={i} />
            ))}
          </div>
        ) : contractsData?.data.length === 0 ? (
          <div className="bg-bg-card p-12 rounded-xl border border-border flex flex-col items-center text-center">
            <p className="text-text-subtle text-lg">Nessun contratto associato a questo proprietario.</p>
            <Button 
                variant="primary" 
                className="mt-8"
                onClick={() => navigate('/contracts/new', { state: { ownerId: owner?.id, returnUrl: window.location.pathname + window.location.search } })}
            >
                Aggiungi il primo contratto
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {contractsData?.data.map((contract) => (
                <ContractCard 
                  key={contract.id} 
                  contract={contract as ContractWithRelations} 
                  displayMode="tenant"
                  onEdit={() => navigate(`/contracts/${contract.id}?mode=edit`, { state: location.state })}
                  onDelete={() => dispatch({ type: 'OPEN_DELETE_CONTRACT_MODAL', payload: contract as ContractWithRelations })}
                />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={contractsData?.pagination.totalPages || 1}
              onPageChange={setPage}
              scrollTargetRef={state.isMobile ? contractsSectionRef as React.RefObject<HTMLElement> : undefined}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {owner && (
        <EditOwnerModal
          isOpen={state.isEditModalOpen}
          onClose={() => dispatch({ type: 'CLOSE_EDIT_MODAL' })}
          owner={owner}
          showDelete
        />
      )}

      <DeleteModal
        isOpen={state.isDeleteContractModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_DELETE_CONTRACT_MODAL' })}
        onConfirm={confirmDeleteContract}
        title="Elimina contratto"
        message={`Sei sicuro di voler eliminare questo contratto? L'operazione sarà irreversibile.`}
        isLoading={deleteContractMutation.isPending}
      />
    </div>
  );
};

export default OwnerDetailPage;

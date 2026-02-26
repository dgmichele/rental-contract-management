import React, { useState, useRef, useEffect, type RefObject } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaFileContract, FaEuroSign, FaPlusCircle } from 'react-icons/fa';
import { useOwner, useOwnerContracts } from '../../hooks/useOwners';
import { useDeleteContract } from '../../hooks/useContracts';
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

const OwnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ownerId = Number(id);
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  
  const setPage = (newPage: number) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: true });
  };
  // Ref per lo scroll smooth della paginazione verso la sezione contratti (solo mobile ≤ 600px)
  const contractsSectionRef = useRef<HTMLHeadingElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithRelations | null>(null);
  const [isDeleteContractModalOpen, setIsDeleteContractModalOpen] = useState(false);

  const { data: ownerData, isLoading: isOwnerLoading, error: ownerError } = useOwner(ownerId);
  const { data: contractsData, isLoading: isContractsLoading } = useOwnerContracts(ownerId, page, 12);
  const deleteContractMutation = useDeleteContract();


  if (!isOwnerLoading && (ownerError || !ownerData?.success)) {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <p className="text-text-body font-semibold text-xl">Proprietario non trovato 😰</p>
        <Button variant="primary" onClick={() => navigate('/owners')} className="mt-8">
          Torna alla lista
        </Button>
      </div>
    );
  }

  const owner = ownerData?.data;

  const handleDeleteContract = (contract: ContractWithRelations) => {
    setSelectedContract(contract);
    setIsDeleteContractModalOpen(true);
  };

  const confirmDeleteContract = async () => {
    if (selectedContract) {
      await deleteContractMutation.mutateAsync(selectedContract.id);
      setIsDeleteContractModalOpen(false);
      setSelectedContract(null);
    }
  };

  const getBackLabel = () => {
    return 'Torna indietro';
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-semibold cursor-pointer"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          {getBackLabel()}
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
                onClick={() => setIsEditModalOpen(true)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {isOwnerLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : owner && (
          <>
            <StatsCard
              label="Contratti attivi"
              value={owner.stats.total_contracts}
              icon={<FaFileContract />}
            />
            <StatsCard
              label="Canone mensile totale"
              value={`${owner.stats.total_monthly_rent.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`}
              icon={<FaEuroSign />}
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
                  onEdit={() => navigate(`/contracts/${contract.id}?mode=view`, { state: location.state })}
                  onDelete={() => handleDeleteContract(contract as ContractWithRelations)}
                />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={contractsData?.pagination.totalPages || 1}
              onPageChange={setPage}
              scrollTargetRef={isMobile ? contractsSectionRef as RefObject<HTMLElement> : undefined}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {owner && (
        <EditOwnerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          owner={owner}
          showDelete
        />
      )}

      <DeleteModal
        isOpen={isDeleteContractModalOpen}
        onClose={() => {
          setIsDeleteContractModalOpen(false);
          setSelectedContract(null);
        }}
        onConfirm={confirmDeleteContract}
        title="Elimina contratto"
        message={`Sei sicuro di voler eliminare questo contratto? L'operazione sarà irreversibile.`}
        isLoading={deleteContractMutation.isPending}
      />
    </div>
  );
};

export default OwnerDetailPage;

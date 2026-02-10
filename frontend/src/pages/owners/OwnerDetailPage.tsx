import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaFileContract, FaEuroSign } from 'react-icons/fa';
import { useOwner, useOwnerContracts } from '../../hooks/useOwners';
import { useDeleteContract } from '../../hooks/useContracts';
import { StatsCard } from '../../components/cards/StatsCard';
import { ContractCard } from '../../components/cards/ContractCard';
import { ContractCardSkeleton } from '../../components/cards/ContractCardSkeleton';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import EditOwnerModal from '../../components/modals/EditOwnerModal';
import DeleteModal from '../../components/modals/DeleteModal';
import Spinner from '../../components/ui/Spinner';
import type { ContractWithRelations } from '../../types/shared';

const OwnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ownerId = Number(id);

  const [page, setPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithRelations | null>(null);
  const [isDeleteContractModalOpen, setIsDeleteContractModalOpen] = useState(false);

  const { data: ownerData, isLoading: isOwnerLoading, error: ownerError } = useOwner(ownerId);
  const { data: contractsData, isLoading: isContractsLoading } = useOwnerContracts(ownerId, page, 12);
  const deleteContractMutation = useDeleteContract();

  if (isOwnerLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner className="h-12 w-12 border-4" />
      </div>
    );
  }

  if (ownerError || !ownerData?.success) {
    return (
      <div className="text-center py-12">
        <p className="text-error font-semibold text-xl">Proprietario non trovato</p>
        <Button variant="primary" onClick={() => navigate('/owners')} className="mt-4">
          Torna alla lista
        </Button>
      </div>
    );
  }

  const owner = ownerData.data;

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

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/owners')}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-semibold group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Torna ai proprietari
        </button>
      </div>

      {/* Header with Title and Edit */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-heading text-text-title">
          {owner.name} {owner.surname}
        </h1>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="p-2.5 bg-bg-card border border-border rounded-full text-secondary hover:text-primary hover:border-primary transition-all shadow-sm"
          title="Modifica proprietario"
        >
          <FaEdit size={18} />
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

      {/* Contracts Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-title pb-2">
          Contratti associati:
        </h2>

        {isContractsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ContractCardSkeleton key={i} />
            ))}
          </div>
        ) : contractsData?.data.length === 0 ? (
          <div className="bg-bg-card p-12 rounded-xl border border-border text-center">
            <p className="text-text-subtle text-lg">Nessun contratto associato a questo proprietario.</p>
            <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => navigate('/contracts/new', { state: { ownerId: owner.id } })}
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
                  onEdit={() => navigate(`/contracts/${contract.id}?mode=edit`)}
                  onDelete={() => handleDeleteContract(contract as ContractWithRelations)}
                />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={contractsData?.pagination.totalPages || 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <EditOwnerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        owner={owner}
        showDelete
      />

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

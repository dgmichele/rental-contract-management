import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { useContracts, useDeleteContract } from '../../hooks/useContracts';
import { ContractCard } from '../../components/cards/ContractCard';
import { ContractCardSkeleton } from '../../components/cards/ContractCardSkeleton';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import DeleteModal from '../../components/modals/DeleteModal';
import ContractFiltersModal from '../../components/modals/ContractFiltersModal';
import type { ContractWithRelations } from '../../types/shared';
import clsx from 'clsx'; // Per conditional classes

const ContractsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<{ expiryMonth?: number; expiryYear?: number }>({});
  
  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithRelations | null>(null);

  const { data, isLoading, error } = useContracts({
    page,
    limit: 12,
    search: debouncedSearch,
    ...filters,
  });
  
  const deleteContractMutation = useDeleteContract();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleDelete = (contract: ContractWithRelations) => {
    setSelectedContract(contract);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedContract) {
      await deleteContractMutation.mutateAsync(selectedContract.id);
      setIsDeleteModalOpen(false);
      setSelectedContract(null);
    }
  };

  const handleApplyFilters = (newFilters: { expiryMonth?: number; expiryYear?: number }) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
    setIsFiltersModalOpen(false);
  };

  // Check if any filter is active for UI indication
  const hasActiveFilters = filters.expiryMonth !== undefined || filters.expiryYear !== undefined;

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-heading text-text-title">Tutti i contratti</h1>
        <Button 
          variant="primary" 
          onClick={() => navigate('/contracts/new')}
          className="px-3 sm:px-4 py-2 text-sm shrink-0"
        >
          <FaPlus />
          <span className="hidden xs:inline ml-1">Aggiungi contratto</span>
          <span className="xs:hidden ml-1">Aggiungi</span>
        </Button>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex gap-2 w-full max-w-md">
        <div className="relative grow group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-subtle group-focus-within:text-secondary transition-colors">
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder="Cerca proprietario o inquilino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-bg-card border border-border rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-secondary placeholder:text-text-subtle transition-all duration-300 w-full shadow-sm"
          />
        </div>
        <button
          onClick={() => setIsFiltersModalOpen(true)}
          className={clsx(
            "flex items-center justify-center px-4 py-2.5 rounded-lg border transition-all duration-300",
            hasActiveFilters 
              ? "bg-secondary text-white border-secondary hover:bg-primary" 
              : "bg-bg-card border-border text-text-body hover:border-secondary hover:text-secondary"
          )}
          title="Filtra contratti"
        >
          <FaFilter />
        </button>
      </div>

      {/* Grid Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContractCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-error font-semibold">Si è verificato un errore durante il caricamento dei contratti.</p>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-border">
          <p className="text-text-body">Nessun contratto trovato.</p>
          {(search || hasActiveFilters) && (
            <p className="text-text-subtle text-sm mt-2">Prova a modificare i filtri o la ricerca.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {data?.data.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                displayMode="owner" // Nella lista generale mostriamo proprietario come titolo principale (default)
                onEdit={() => navigate(`/contracts/${contract.id}?mode=edit`)}
                onDelete={() => handleDelete(contract)}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={data?.pagination.totalPages || 1}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Modals */}
      <ContractFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedContract(null);
        }}
        onConfirm={confirmDelete}
        title="Elimina contratto"
        message={`Sei sicuro di voler eliminare questo contratto? L'operazione sarà irreversibile.`}
        isLoading={deleteContractMutation.isPending}
      />
    </div>
  );
};

export default ContractsListPage;

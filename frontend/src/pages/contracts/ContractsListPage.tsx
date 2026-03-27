import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { useContracts } from '../../hooks/useContracts';
import { useContractsListLogic } from './hooks/useContractsListLogic';
import { ContractCard } from '../../components/cards/ContractCard';
import { ContractCardSkeleton } from '../../components/cards/ContractCardSkeleton';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import DeleteModal from '../../components/modals/DeleteModal';
import ContractFiltersModal from '../../components/modals/ContractFiltersModal';
import clsx from 'clsx';

const ContractsListPage = () => {
  const navigate = useNavigate();
  
  const {
    state,
    dispatch,
    searchParams: { page, setPage, search, setSearch, debouncedSearch, filters, hasActiveFilters },
    searchContainerRef,
    deleteContractMutation,
    confirmDelete,
    handleApplyFilters
  } = useContractsListLogic();

  const { data, isLoading, error } = useContracts({
    page,
    limit: 12,
    search: debouncedSearch,
    ...filters,
  });

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-heading text-text-title">Tutti i contratti</h1>
        <Button 
          variant="primary" 
          onClick={() => navigate('/contracts/new', { state: { returnUrl: window.location.pathname + window.location.search } })}
          className="px-3 sm:px-4 py-2 text-sm shrink-0"
        >
          <FaPlus />
          <span className="hidden xs:inline ml-1">Aggiungi contratto</span>
          <span className="xs:hidden ml-1">Aggiungi</span>
        </Button>
      </div>

      {/* Sticky Filter Button for Mobile/Tablet */}
      <div className={clsx(
        "fixed top-24 right-0 z-40 lg:hidden transition-all duration-500 ease-in-out pointer-events-none",
        state.showStickyFilter ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      )}>
      <button
        onClick={() => dispatch({ type: 'OPEN_FILTERS_MODAL', openedViaSticky: true })}
        className={clsx(
            "flex items-center justify-center w-12 h-12 rounded-l-2xl border-y border-l shadow-xl pointer-events-auto active:scale-95 transition-all duration-300",
            hasActiveFilters 
              ? "bg-secondary text-white border-secondary" 
              : "bg-bg-card border-border text-text-body"
          )}
          title="Filtra contratti"
        >
          <FaFilter className={clsx(hasActiveFilters)} />
        </button>
      </div>

      {/* Search Bar & Filters & Counter */}
      <div ref={searchContainerRef} className="space-y-2">
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
            onClick={() => dispatch({ type: 'OPEN_FILTERS_MODAL', openedViaSticky: false })}
            className={clsx(
              "flex items-center justify-center px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer shadow-sm",
              hasActiveFilters 
                ? "bg-secondary text-white border-secondary hover:bg-primary" 
                : "bg-bg-card border-border text-text-body hover:border-secondary hover:text-secondary"
            )}
            title="Filtra contratti"
          >
            <FaFilter />
          </button>
        </div>

        {!isLoading && !error && data && (
          <p className="text-text-subtle text-sm ml-1">
            Totale contratti: <span className="font-semibold text-text-body">{data.pagination.total}</span>
          </p>
        )}
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
                onEdit={() => navigate(`/contracts/${contract.id}?mode=edit`, { state: { returnUrl: window.location.pathname + window.location.search } })}
                onDelete={() => dispatch({ type: 'OPEN_DELETE_MODAL', payload: contract })}
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
        isOpen={state.isFiltersModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_FILTERS_MODAL' })}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      <DeleteModal
        isOpen={state.isDeleteModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_DELETE_MODAL' })}
        onConfirm={confirmDelete}
        title="Elimina contratto"
        message={`Sei sicuro di voler eliminare questo contratto? L'operazione sarà irreversibile.`}
        isLoading={deleteContractMutation.isPending}
      />
    </div>
  );
};

export default ContractsListPage;

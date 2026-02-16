import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useOwners, useDeleteOwner } from '../../hooks/useOwners';
import OwnerCard from '../../components/cards/OwnerCard';
import OwnerCardSkeleton from '../../components/cards/OwnerCardSkeleton';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import AddOwnerModal from '../../components/modals/AddOwnerModal';
import EditOwnerModal from '../../components/modals/EditOwnerModal';
import DeleteModal from '../../components/modals/DeleteModal';
import ViewOwnerModal from '../../components/modals/ViewOwnerModal';
import type { Owner } from '../../types/owner';

const OwnersListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  const { data, isLoading, error } = useOwners(page, 12, debouncedSearch);
  const deleteOwnerMutation = useDeleteOwner();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleEdit = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsEditModalOpen(true);
  };

  const handleDelete = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsDeleteModalOpen(true);
  };

  const handleView = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOwner) {
      await deleteOwnerMutation.mutateAsync(selectedOwner.id);
      setIsDeleteModalOpen(false);
      setSelectedOwner(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-heading text-text-title">Tutti i proprietari</h1>
        <Button 
          variant="primary" 
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 sm:px-4 py-2 text-sm shrink-0"
        >
          <FaPlus />
          <span className="hidden xs:inline ml-1">Aggiungi proprietario</span>
          <span className="xs:hidden ml-1">Aggiungi</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-subtle group-focus-within:text-secondary transition-colors">
          <FaSearch />
        </div>
        <input
          type="text"
          placeholder="Cerca per nome o cognome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-bg-card border border-border rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-secondary placeholder:text-text-subtle transition-all duration-300 w-full shadow-sm"
        />
      </div>

      {/* Grid Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <OwnerCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-error font-semibold">Si è verificato un errore durante il caricamento dei proprietari.</p>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-border">
          <p className="text-text-body">Nessun proprietario trovato.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {data?.data.map((owner) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                onView={() => handleView(owner)}
                onEdit={() => handleEdit(owner)}
                onDelete={() => handleDelete(owner)}
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
      <AddOwnerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      {selectedOwner && (
        <>
          <EditOwnerModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedOwner(null);
            }}
            owner={selectedOwner}
          />
          
          <ViewOwnerModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedOwner(null);
            }}
            owner={selectedOwner}
          />

          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedOwner(null);
            }}
            onConfirm={confirmDelete}
            title="Elimina proprietario"
            message={`Sei sicuro di voler eliminare ${selectedOwner.name} ${selectedOwner.surname}? L'operazione eliminerà anche tutti i contratti associati e sarà irreversibile.`}
            isLoading={deleteOwnerMutation.isPending}
          />
        </>
      )}
    </div>
  );
};

export default OwnersListPage;

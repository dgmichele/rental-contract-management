import { useState } from 'react';
import BaseModal from './BaseModal';
import DeleteModal from './DeleteModal';
import OwnerForm, { type OwnerFormData } from '../forms/OwnerForm';
import { useUpdateOwner, useDeleteOwner } from '../../hooks/useOwners';
import { useNavigate } from 'react-router-dom';
import type { Owner } from '../../types/owner';

interface EditOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: Owner;
  showDelete?: boolean;
}

/**
 * Modal wrapper per la modifica di un proprietario esistente.
 * Carica i dati iniziali nel form e gestisce la mutazione di aggiornamento.
 */
export default function EditOwnerModal({
  isOpen,
  onClose,
  owner,
  showDelete = false,
}: EditOwnerModalProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { mutate: updateOwner, isPending } = useUpdateOwner();
  const { mutate: deleteOwner, isPending: isDeletePending } = useDeleteOwner();

  const handleUpdateOwner = (data: OwnerFormData) => {
    updateOwner(
      { id: owner.id, data },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleDelete = () => {
    deleteOwner(owner.id, {
      onSuccess: () => {
        setIsDeleting(false);
        onClose();
        navigate('/owners');
      }
    });
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Modifica Proprietario"
        size="md"
      >
        <div className="py-2">
          <p className="text-sm text-text-subtle mb-6">
            Aggiorna le informazioni di contatto per <strong>{owner.name} {owner.surname}</strong>.
          </p>

          <OwnerForm
            initialData={{
              name: owner.name,
              surname: owner.surname,
              email: owner.email,
              phone: owner.phone
            }}
            onSubmit={handleUpdateOwner}
            onDelete={showDelete ? () => setIsDeleting(true) : undefined}
            isLoading={isPending}
            submitLabel="Conferma Modifiche"
          />
        </div>
      </BaseModal>

      {showDelete && (
        <DeleteModal
          isOpen={isDeleting}
          onClose={() => setIsDeleting(false)}
          onConfirm={handleDelete}
          title="Elimina Proprietario"
          message={`Sei sicuro di voler eliminare ${owner.name} ${owner.surname}? Tutti i contratti associati verranno eliminati permanentemente.`}
          isLoading={isDeletePending}
        />
      )}
    </>
  );
}


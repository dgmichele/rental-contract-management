import BaseModal from './BaseModal';
import OwnerForm, { type OwnerFormData } from '../forms/OwnerForm';
import { useUpdateOwner } from '../../hooks/useOwners';
import type { Owner } from '../../types/owner';

interface EditOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: Owner;
}

/**
 * Modal wrapper per la modifica di un proprietario esistente.
 * Carica i dati iniziali nel form e gestisce la mutazione di aggiornamento.
 * 
 * @param isOpen Stato di apertura
 * @param onClose Funzione per chiudere il modal
 * @param owner Oggetto proprietario da modificare
 */
export default function EditOwnerModal({
  isOpen,
  onClose,
  owner,
}: EditOwnerModalProps) {
  const { mutate: updateOwner, isPending } = useUpdateOwner();

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

  return (
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
          isLoading={isPending}
          submitLabel="Conferma Modifiche"
        />
      </div>
    </BaseModal>
  );
}


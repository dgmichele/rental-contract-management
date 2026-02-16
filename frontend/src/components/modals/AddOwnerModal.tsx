import BaseModal from './BaseModal';
import OwnerForm, { type OwnerFormData } from '../forms/OwnerForm';
import { useCreateOwner } from '../../hooks/useOwners';

interface AddOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal wrapper per la creazione di un nuovo proprietario.
 * Utilizza l'hook useCreateOwner per gestire la logica di mutazione e i toast.
 * 
 * @param isOpen Stato di apertura del modal
 * @param onClose Funzione per chiudere il modal
 */
export default function AddOwnerModal({ isOpen, onClose }: AddOwnerModalProps) {
  const { mutate: createOwner, isPending } = useCreateOwner();

  const handleCreateOwner = (data: OwnerFormData) => {
    // Chiama la mutazione. L'hook useCreateOwner gestisce già success/error toast e refetch
    createOwner(data, {
      onSuccess: () => {
        onClose(); // Chiude il modal solo in caso di successo
      },
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi Proprietario"
      size="md"
    >
      <div className="py-2">
        <p className="text-sm text-text-subtle mb-6">
          Inserisci i dati per creare un nuovo proprietario.
        </p>
        
        <OwnerForm
          onSubmit={handleCreateOwner}
          isLoading={isPending}
          submitLabel="Crea proprietario"
        />
      </div>
    </BaseModal>
  );
}

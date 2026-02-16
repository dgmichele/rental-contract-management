import BaseModal from './BaseModal';
import Button from '../ui/Button';
import { FaExclamationTriangle } from 'react-icons/fa';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

/**
 * Modal di conferma eliminazione.
 * Layout standard con icona di avviso e pulsanti di azione.
 * 
 * @param isOpen Stato di apertura
 * @param onClose Azione su annulla/chiudi
 * @param onConfirm Azione su conferma eliminazione
 * @param title Titolo del modal
 * @param message Messaggio di avviso/spiegazione
 * @param isLoading Stato di caricamento del pulsante conferma
 */
export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: DeleteModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="flex flex-col items-center text-center">
        {/* Icona Warning */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <FaExclamationTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>

        <div className="mt-2">
          <p className="text-sm text-text-body">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 bg-button-primary hover:bg-button-primary-hover order-1 sm:order-2"
          >
            Elimina
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

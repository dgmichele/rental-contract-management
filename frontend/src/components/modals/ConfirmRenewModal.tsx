import BaseModal from './BaseModal';
import Button from '../ui/Button';
import { FaFileContract, FaExclamationCircle } from 'react-icons/fa';
import dayjs from 'dayjs';

interface ConfirmRenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newStartDate?: string;
  newEndDate?: string;
  isLoading?: boolean;
}

/**
 * Modal di conferma per il rinnovo del contratto.
 */
export default function ConfirmRenewModal({
  isOpen,
  onClose,
  onConfirm,
  newStartDate,
  newEndDate,
  isLoading = false,
}: ConfirmRenewModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Conferma rinnovo"
      size="sm"
    >
      <div className="flex flex-col items-center">
        {/* Icona */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mb-4">
          <FaFileContract className="h-8 w-8 text-secondary" aria-hidden="true" />
        </div>

        <div className="mt-2 space-y-3">
          <p className="text-sm text-text-body text-center">
            Confermi il rinnovo con la nuova durata?
          </p>
          <p className="text-2xl font-bold text-text-title font-body text-center">
            {newStartDate ? dayjs(newStartDate).format('DD/MM/YYYY') : ''} - {newEndDate ? dayjs(newEndDate).format('DD/MM/YYYY') : ''}
          </p>
          <div className="flex items-start gap-3 bg-bg-card p-3 rounded-lg border border-secondary mt-6">
            <span className="text-2xl shrink-0 text-secondary"><FaExclamationCircle /></span>
            <p className="text-sm text-text-title leading-relaxed font-medium">
              Questa azione rinnoverà il contratto con i nuovi dati inseriti. Assicurati di aver inserito le date corrette prima di confermare.
            </p>
          </div>
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
            className="flex-1 order-1 sm:order-2"
          >
            Conferma
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

import BaseModal from './BaseModal';
import Button from '../ui/Button';
import { FaFileContract, FaExclamationCircle } from 'react-icons/fa';

interface ConfirmAnnuityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  annuityYear: number;
  isLoading?: boolean;
}

/**
 * Modal di conferma rinnovo annualità.
 * Mostra chiaramente quale anno viene confermato prima di procedere.
 * 
 * @param isOpen Stato di apertura
 * @param onClose Azione su annulla/chiudi
 * @param onConfirm Azione su conferma
 * @param annuityYear Anno dell'annualità da confermare
 * @param isLoading Stato di caricamento del pulsante conferma
 */
export default function ConfirmAnnuityModal({
  isOpen,
  onClose,
  onConfirm,
  annuityYear,
  isLoading = false,
}: ConfirmAnnuityModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Conferma rinnovo annualità"
      size="sm"
    >
      <div className="flex flex-col items-center">
        {/* Icona */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mb-4">
          <FaFileContract className="h-8 w-8 text-secondary" aria-hidden="true" />
        </div>

        <div className="mt-2 space-y-3">
          <p className="text-sm text-text-body text-center">
            Conferma il pagamento per l'anno:
          </p>
          <p className="text-4xl font-bold text-text-title font-body text-center">
            {annuityYear}
          </p>
          <div className="flex items-start gap-3 bg-bg-card p-3 rounded-lg border border-secondary mt-6">
            <span className="text-2xl shrink-0 text-secondary"><FaExclamationCircle /></span>
            <p className="text-sm text-text-title leading-relaxed font-medium">
              Questa azione segnerà l'annualità come pagata. Assicurati che l'anno sia corretto prima di procedere.
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

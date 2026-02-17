import BaseModal from './BaseModal';
import { FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';
import type { Owner } from '../../types/owner';

interface ViewOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: Owner;
}

/**
 * Modal per la sola visualizzazione dei dati di un proprietario.
 * Layout pulito con icone e separatori per una lettura chiara.
 * 
 * @param isOpen Stato di apertura
 * @param onClose Funzione per chiudere il modal
 * @param owner Oggetto proprietario da visualizzare
 */
export default function ViewOwnerModal({
  isOpen,
  onClose,
  owner,
}: ViewOwnerModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Dettagli proprietario"
      size="md"
    >
      <div className="space-y-6">
        {/* Identità */}
        <div className="flex items-start gap-4 p-4 bg-bg-card border border-border rounded-lg shadow-sm">
          <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
            <FaIdCard size={24} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-1">
              Nome e Cognome
            </h4>
            <p className="text-lg font-bold text-text-title leading-tight">
              {owner.name} {owner.surname}
            </p>
          </div>
        </div>

        {/* Contatti Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Email */}
          <div className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-lg">
            <div className="bg-secondary/10 p-2.5 rounded-full text-secondary">
              <FaEnvelope size={18} />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-0.5">
                Email
              </h4>
              <p className="text-sm font-medium text-text-body break-all">
                {owner.email}
              </p>
            </div>
          </div>

          {/* Telefono */}
          <div className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-lg">
            <div className="bg-secondary/10 p-2.5 rounded-full text-secondary">
              <FaPhone size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-0.5">
                Telefono
              </h4>
              <p className="text-sm font-medium text-text-body">
                {owner.phone || 'Non specificato'}
              </p>
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="px-2">
            <p className="text-[11px] text-text-subtle italic">
                * Le statistiche relative a contratti e canoni sono visualizzabili nella pagina di dettaglio del proprietario.
            </p>
        </div>
      </div>
    </BaseModal>
  );
}

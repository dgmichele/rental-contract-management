import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { FaEye, FaEdit, FaTrash, FaUser, FaFolderOpen } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { Owner } from '../../types/owner';

interface OwnerCardProps {
  owner: Owner;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewContracts?: () => void;
  className?: string;
}

/**
 * Card per la visualizzazione sintetica di un Proprietario.
 * Utilizzata nella OwnersListPage.
 * 
 * @param owner Oggetto proprietario
 * @param onView Handler per visualizzare i dettagli (modal)
 * @param onEdit Handler per modificare il proprietario (modal)
 * @param onDelete Handler per eliminare il proprietario (modal)
 * @param onViewContracts Handler opzionale per vedere i contratti (default: navigazione interna)
 */
export default function OwnerCard({
  owner,
  onView,
  onEdit,
  onDelete,
  onViewContracts,
  className,
}: OwnerCardProps) {
  const navigate = useNavigate();

  const handleViewContracts = () => {
    if (onViewContracts) {
      onViewContracts();
    } else {
      navigate(`/owners/${owner.id}`);
    }
  };

  return (
    <Card 
      className={clsx("flex flex-col relative h-full transition-transform duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg", className)}
    >
      {/* Icone Azione in alto a destra - Colori e transizioni come da AGENTS.md */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="text-secondary hover:text-primary-hover transition-colors duration-300 p-2 rounded-full hover:bg-bg-main cursor-pointer"
          title="Visualizza dettagli"
        >
          <FaEye size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-secondary hover:text-primary-hover transition-colors duration-300 p-2 rounded-full hover:bg-bg-main cursor-pointer"
          title="Modifica"
        >
          <FaEdit size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-secondary hover:text-error transition-colors duration-300 p-2 rounded-full hover:bg-bg-main cursor-pointer"
          title="Elimina"
        >
          <FaTrash size={16} />
        </button>
      </div>

      {/* Header Info */}
      <div className="mb-4 mt-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
            <FaUser size={20} />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xl font-bold text-text-title leading-tight truncate" title={`${owner.name} ${owner.surname}`}>
              {owner.name} {owner.surname}
            </h3>
            <p className="text-xs text-text-subtle uppercase font-semibold tracking-wider">
              Proprietario
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-auto pt-8">
        <Button
          variant="primary"
          className="w-full text-sm py-2.5 shadow-sm group"
          onClick={handleViewContracts}
        >
          <FaFolderOpen className="group-hover:scale-110 transition-transform duration-300" />
          Visualizza contratti
        </Button>
      </div>
    </Card>
  );
}

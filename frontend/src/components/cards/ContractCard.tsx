
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { FaEye, FaHome, FaCalendarDay, FaMoneyBillWave, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { ContractWithRelations } from '../../types/shared';

interface ContractCardProps {
  contract: ContractWithRelations;
  expiryType?: 'contract' | 'annuity';
  expiryDate?: string; // ISO string expected
  annuityYear?: number;
  displayMode?: 'owner' | 'tenant'; // 'owner' shows owner as title, 'tenant' shows tenant as title
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const ContractCard = ({ 
  contract, 
  expiryType, 
  expiryDate, 
  annuityYear, 
  displayMode = 'owner',
  onEdit,
  onDelete,
  className 
}: ContractCardProps) => {
  const navigate = useNavigate();

  const isCedolareSecca = contract.cedolare_secca;
  const isNaturalExpiration = expiryType === 'contract'; 
  
  // Logic:
  // "Gestisci rinnovo" -> If cedolare secca OR natural expiration
  // "Gestisci annualità" -> If NOT cedolare secca AND intermediate annuity
  const isRenewal = isCedolareSecca || isNaturalExpiration;
  
  // Base button label logic: if expiryType is provided, we use manage labels, 
  // otherwise (like in detail pages) we use "Visualizza contratto"
  let buttonLabel = isRenewal ? 'Gestisci rinnovo' : 'Gestisci annualità';
  if (!expiryType) {
    buttonLabel = 'Visualizza contratto';
  }
  
  const handleManage = () => {
    if (!expiryType) {
      handleView();
      return;
    }
    // Navigate to single contract page in specific mode
    const mode = isRenewal ? 'renewal' : 'annuity';
    navigate(`/contracts/${contract.id}?mode=${mode}`);
  };

  const handleView = () => {
    navigate(`/contracts/${contract.id}?mode=view`);
  };

  const formattedDate = expiryDate 
    ? dayjs(expiryDate).format('DD/MM/YYYY') 
    : dayjs(contract.end_date).format('DD/MM/YYYY');

  return (
    <Card className={clsx("flex flex-col relative h-full transition-transform hover:-translate-y-1 shadow-sm hover:shadow-lg", className)}>
      {/* Cedolare Secca Banner */}
      {isCedolareSecca && (
        <div className="absolute top-0 left-0 bg-secondary/10 text-secondary border-b border-r border-secondary/20 text-[10px] font-bold px-3 py-1 rounded-br-lg rounded-tl-lg z-10 uppercase tracking-wider">
          Cedolare Secca
        </div>
      )}

      {/* Action Icons Top Right */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 z-20 mb-4">
        <button 
          onClick={handleView}
          className="text-secondary hover:text-primary transition-all duration-300 p-2 rounded-full hover:bg-bg-main/30 cursor-pointer active:scale-95"
          title="Visualizza dettagli"
          aria-label="Visualizza dettagli contratto"
        >
          <FaEye size={16} />
        </button>
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-secondary hover:text-primary transition-all duration-300 p-2 rounded-full hover:bg-bg-main/30 cursor-pointer active:scale-95"
            title="Modifica"
            aria-label="Modifica contratto"
          >
            <FaEdit size={16} />
          </button>
        )}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-secondary hover:text-primary transition-all duration-300 p-2 rounded-full hover:bg-bg-main/30 cursor-pointer active:scale-95"
            title="Elimina"
            aria-label="Elimina contratto"
          >
            <FaTrash size={16} />
          </button>
        )}
      </div>

      {/* Header Info */}
      <div className={clsx("mb-3", isCedolareSecca ? "mt-9" : "mt-6")}>
        <div className="flex items-start gap-3">
            <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary shrink-0">
               <FaUser size={16} />
            </div>
            <div className="overflow-hidden"> {/* Increased top margin above handles icon clearance */}
                {displayMode === 'owner' ? (
                  <>
                    <h3 className="text-lg font-bold text-text-title leading-tight truncate" title={`${contract.owner.name} ${contract.owner.surname}`}>
                        {contract.owner.name} {contract.owner.surname}
                    </h3>
                    <p className="text-sm text-text-body truncate" title={`Inquilino: ${contract.tenant.name} ${contract.tenant.surname}`}>
                        Inquilino: {contract.tenant.name} {contract.tenant.surname}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-text-title leading-tight truncate" title={`${contract.tenant.name} ${contract.tenant.surname}`}>
                        {contract.tenant.name} {contract.tenant.surname}
                    </h3>
                    <p className="text-xs text-text-subtle uppercase font-semibold tracking-wider">
                      Inquilino
                    </p>
                  </>
                )}
            </div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-4 flex items-start gap-2 text-sm text-text-body bg-bg-main/50 p-2 rounded">
        <FaHome className="mt-0.5 shrink-0 text-text-subtle" />
        <span className="line-clamp-2 leading-snug">{contract.address || 'Indirizzo non presente'}</span>
      </div>

      {/* Expiry Details */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-bg-card rounded-lg border border-border/50 shadow-sm">
         <FaCalendarDay className={clsx("text-xl shrink-0", isNaturalExpiration ? "text-error" : "text-warning")} />
         <div className="flex flex-col overflow-hidden">
            <span className="text-xs text-text-subtle font-medium uppercase truncate w-full">
                {expiryType === 'annuity' ? `Scadenza Annualità ${annuityYear || ''}` : 'Scadenza Contratto'}
            </span>
            <span className="font-bold text-text-title">{formattedDate}</span>
         </div>
      </div>

      {/* Financials Grid */}
      <div className={clsx("grid gap-3 mb-4 mt-auto", isCedolareSecca ? "grid-cols-1" : "grid-cols-2")}>
         <div className="bg-bg-card/50 p-2 rounded flex flex-col justify-between">
            <span className="text-xs text-text-subtle block mb-1">Canone</span>
            <div className="flex items-center gap-1 font-semibold text-text-title text-sm">
                <FaMoneyBillWave className="text-success shrink-0" />
                <span className="truncate">€ {contract.monthly_rent}</span>
            </div>
         </div>
         
         {!isCedolareSecca && (
             <div className="bg-bg-card/50 p-2 rounded flex flex-col justify-between">
                <span className="text-xs text-text-subtle block mb-1 truncate" title="Ultima Annualità Pagata">Ultima annualità pagata</span>
                <span className="font-semibold text-text-title text-sm truncate">
                    {contract.last_annuity_paid ? `Anno ${contract.last_annuity_paid}` : '-'}
                </span>
             </div>
         )}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Button 
            variant="primary" 
            className="w-full text-sm py-2 shadow-sm"
            onClick={handleManage}
        >
            {buttonLabel}
        </Button>
      </div>
    </Card>
  );
};

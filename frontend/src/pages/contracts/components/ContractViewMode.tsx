import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaHome, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaFileContract, 
  FaCheckCircle, 
  FaTimesCircle,
  FaScroll
} from 'react-icons/fa';
import { AnnuityTimeline } from '../../../components/timeline/AnnuityTimeline';
import Button from '../../../components/ui/Button';
import { formatCurrency } from '../../../utils/format';
import type { ContractWithRelations } from '../../../types/shared';

interface ContractViewModeProps {
  contract: ContractWithRelations;
  onDeleteClick: () => void;
}

export const ContractViewMode: React.FC<ContractViewModeProps> = ({ 
  contract, 
  onDeleteClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      {/* Intestazione */}
      <div className="bg-bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-title mb-2">
              Contratto tra {contract.owner.name} {contract.owner.surname} e {contract.tenant.name} {contract.tenant.surname}
            </h2>
            <div className="flex flex-wrap gap-2">
              {contract.cedolare_secca && (
                <span className="bg-secondary text-white text-xs px-2 py-1 rounded-full font-medium">
                  Cedolare Secca
                </span>
              )}
              <span className="bg-bg-main text-text-body border border-border text-xs px-2 py-1 rounded-full font-medium capitalize">
                {contract.typology}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${new Date(contract.end_date) > new Date() ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                {new Date(contract.end_date) > new Date() ? 'Attivo' : 'Scaduto'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="primary" 
              onClick={() => navigate(`?mode=edit`, { state: { ...location.state, fromView: true } })}
              className="flex items-center gap-2"
            >
              <FaEdit /> Modifica
            </Button>
            <Button 
              variant="secondary" 
              onClick={onDeleteClick}
              className="flex items-center gap-2 text-error hover:text-error/80"
            >
              <FaTrash /> Elimina
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sezione Proprietario */}
        <div className="bg-bg-card rounded-xl border border-border p-6 shadow-sm h-full">
          <h3 className="text-lg font-bold text-text-title mb-4 flex items-center gap-2 pb-2 border-b border-border">
            <FaUser className="text-secondary" /> Dati proprietario
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 md:grid-cols-2 gap-y-2">
              <span className="text-text-subtle text-sm">Nominativo</span>
              <span className="text-text-body font-medium col-span-2 md:col-span-1">{contract.owner.name} {contract.owner.surname}</span>
              
              <span className="text-text-subtle text-sm">Email</span>
              <span className="text-text-body font-medium col-span-2 md:col-span-1 break-all">{contract.owner.email || '-'}</span>
              
              <span className="text-text-subtle text-sm">Telefono</span>
              <span className="text-text-body font-medium col-span-2 md:col-span-1">{contract.owner.phone || '-'}</span>
            </div>
            
              <div className="pt-4 mt-2">
                <Button 
                  variant="secondary" 
                  className="w-full text-sm"
                  onClick={() => navigate(`/owners/${contract.owner_id}`)}
                >
                  Vedi profilo proprietario
                </Button>
              </div>
          </div>
        </div>

        {/* Sezione Inquilino */}
        <div className="bg-bg-card rounded-xl border border-border p-6 shadow-sm h-full">
           <h3 className="text-lg font-bold text-text-title mb-4 flex items-center gap-2 pb-2 border-b border-border">
            <FaUser className="text-secondary" /> Dati inquilino
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 md:grid-cols-2 gap-y-2">
              <span className="text-text-subtle text-sm">Nominativo</span>
              <span className="text-text-body font-medium col-span-2 md:col-span-1">{contract.tenant.name} {contract.tenant.surname}</span>
              
              <span className="text-text-subtle text-sm">Email</span>
              <span className="text-text-body font-medium col-span-2 md:col-span-1 break-all">{contract.tenant.email || '-'}</span>
              
              <span className="text-text-subtle text-sm">Telefono</span>
              <span className="text-text-body font-medium col-span-2 md:col-span-1">{contract.tenant.phone || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione Dati Contratto */}
      <div className="bg-bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-text-title mb-4 flex items-center gap-2 pb-2 border-b border-border">
          <FaFileContract className="text-secondary" /> Dettagli contratto
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-text-subtle text-sm block">Indirizzo immobile</span>
            <div className="flex items-start gap-2">
              <FaHome className="text-text-subtle mt-1 shrink-0" />
              <span className="text-text-body font-medium">{contract.address}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-text-subtle text-sm block">Durata</span>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-text-subtle shrink-0" />
              <span className="text-text-body font-medium">
                {new Date(contract.start_date).toLocaleDateString('it-IT')} - {new Date(contract.end_date).toLocaleDateString('it-IT')}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-text-subtle text-sm block">Canone mensile</span>
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-text-subtle shrink-0" />
              <span className="text-text-body font-medium">
                {formatCurrency(contract.monthly_rent)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-text-subtle text-sm block">Regime fiscale</span>
            <div className="flex items-center gap-2">
              {contract.cedolare_secca ? (
                 <span className="flex items-center gap-2 text-text-body font-medium"><FaScroll  className="text-xs text-text-subtle"/> Cedolare secca</span>
              ) : (
                 <span className="flex items-center gap-2 text-text-body"><FaScroll  className="text-xs text-text-subtle"/> Regime ordinario</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-text-subtle text-sm block">Canone Concordato</span>
            <div className="flex items-center gap-2">
               {contract.canone_concordato ? (
                 <span className="flex items-center gap-2 text-text-body font-medium"><FaCheckCircle className="text-xs text-text-subtle"/> Sì</span>
              ) : (
                 <span className="flex items-center gap-2 text-text-body"><FaTimesCircle className="text-xs text-text-subtle"/> No</span>
              )}
            </div>
          </div>

          {!contract.cedolare_secca && (
            <div className="space-y-1">
              <span className="text-text-subtle text-sm block">Ultima annualità pagata</span>
              <div className="flex items-center gap-2">
                <FaFileContract className="text-text-subtle shrink-0" />
                <span className="text-text-body font-medium">
                  {contract.last_annuity_paid || 'Nessuna'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!contract.cedolare_secca && dayjs(contract.start_date).year() !== dayjs(contract.end_date).year() && (
        <div className="bg-bg-card rounded-xl border border-border p-6 shadow-sm mt-8">
          <h3 className="text-lg font-bold text-text-title mb-4 flex items-center gap-2 pb-2 border-b border-border">
              <FaCalendarAlt className="text-secondary" /> Timeline annualità
          </h3>
          <AnnuityTimeline 
            annuities={contract?.annuities || []}
            contractStartYear={dayjs(contract.start_date).year()}
            contractEndYear={dayjs(contract.end_date).year()}
          />
        </div>
      )}
    </div>
  );
};

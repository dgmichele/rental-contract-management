import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaHome, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaFileContract, 
  FaCheckCircle, 
  FaTimesCircle 
} from 'react-icons/fa';
import { useContract, useCreateContract, useUpdateContract, useDeleteContract } from '../../hooks/useContracts';
import { useOwners } from '../../hooks/useOwners';
import ContractForm from '../../components/forms/ContractForm';
import type { ContractFormData } from '../../components/forms/ContractForm';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import DeleteModal from '../../components/modals/DeleteModal';
import { formatCurrency } from '../../utils/format';

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const modeParam = searchParams.get('mode');
  // Se c'è un ID ma non c'è mode, è view. Se non c'è ID, è add (gestito da route /new)
  const isNew = !id;
  const mode = isNew ? 'add' : (modeParam as 'view' | 'edit' | 'renew' | 'annuity' || 'view');

  // Scroll to top quando cambia mode o dopo il salvataggio
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [mode, location.state?.justSaved]);

  // Pre-selected owner from navigation state (e.g. from OwnerDetailPage)
  const preselectedOwnerId = location.state?.ownerId;

  // Hooks
  const { data: contractData, isLoading: isContractLoading, error: contractError } = useContract(Number(id), !isNew);
  const { data: ownersData, isLoading: isOwnersLoading } = useOwners(1, 100); // Fetch first 100 owners for dropdown
  
  const createContractMutation = useCreateContract();
  const updateContractMutation = useUpdateContract();
  const deleteContractMutation = useDeleteContract();

  // State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Derived state
  const contract = contractData?.data;
  const owners = ownersData?.data || [];
  
  // Loading & Error states
  const isLoading = isContractLoading || (isNew && isOwnersLoading);
  
  if (!isNew && !isLoading && (contractError || !contract)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-text-title">Contratto non trovato 😰</h2>
        <Button variant="primary" onClick={() => navigate('/contracts')} className="mt-4">
          Torna alla lista
        </Button>
      </div>
    );
  }

  // Handlers
  const handleSubmit = async (data: ContractFormData) => {
    try {
      if (mode === 'add') {
        const result = await createContractMutation.mutateAsync({
          ...data,
          last_annuity_paid: data.last_annuity_paid,
        });
        
        if (result?.data?.id) {
          navigate(`/contracts/${result.data.id}?mode=view`, { 
            state: { ...location.state, justSaved: true },
            replace: true 
          });
        } else {
          navigate(-1);
        }
      } else if (mode === 'edit' && contract) {
        await updateContractMutation.mutateAsync({
          id: contract.id,
          data: {
            ...data,
          },
        });
        
        // Reindirizza alla vista dettaglio sostituendo la voce corrente della cronologia
        // per evitare loop al click del tasto "Torna indietro"
        navigate(`/contracts/${contract.id}?mode=view`, { 
          state: { ...location.state, justSaved: true },
          replace: true 
        });
      }
    } catch (error) {
      console.error("Errore salvataggio contratto:", error);
      // Toast gestito dai hook
    }
  };

  const handleDelete = async () => {
    if (contract) {
      await deleteContractMutation.mutateAsync(contract.id);
      setIsDeleteModalOpen(false);
      
      navigate(-1);
    }
  };

  const getBackLabel = () => {
    return mode === 'view' ? 'Torna indietro' : 'Annulla e torna indietro';
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Render View Mode
  const renderViewMode = () => {
    if (!contract) return null;

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
                onClick={() => navigate(`?mode=edit`, { state: location.state })}
                className="flex items-center gap-2"
              >
                <FaEdit /> Modifica
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setIsDeleteModalOpen(true)}
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
                <span className="text-text-subtle text-sm">Nome completo</span>
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
                <span className="text-text-subtle text-sm">Nome completo</span>
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
                   <span className="flex items-center gap-1 text-text-body font-medium"><FaCheckCircle className="text-xs text-text-subtle"/> Cedolare secca</span>
                ) : (
                   <span className="flex items-center gap-1 text-text-body"><FaTimesCircle className="text-xs text-text-subtle"/> Regime ordinario</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-text-subtle text-sm block">Canone Concordato</span>
              <div className="flex items-center gap-2">
                 {contract.canone_concordato ? (
                   <span className="flex items-center gap-1 text-text-body font-medium"><FaCheckCircle className="text-xs text-text-subtle"/> Sì</span>
                ) : (
                   <span className="flex items-center gap-1 text-text-body"><FaTimesCircle className="text-xs text-text-subtle"/> No</span>
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

        {/* Timeline placeholder (not implemented yet per instructions) */}
        {!contract.cedolare_secca && (
          <div className="text-center p-4 border border-dashed border-border rounded-lg text-text-subtle text-sm">
            Timeline annualità non ancora implementata.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Back Button */}
      {!(mode === 'view' && location.state?.justSaved) && (
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-semibold cursor-pointer mb-4"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          {getBackLabel()}
        </button>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-8 max-w-5xl mx-auto">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : mode === 'view' ? (
        renderViewMode()
      ) : (
        <div className="max-w-3xl mx-auto bg-bg-card p-6 sm:p-8 rounded-xl border border-border shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-heading text-text-title mb-8">
            {mode === 'add' ? 'Nuovo contratto' : 'Modifica contratto'}
          </h1>
          
          <ContractForm
            mode={mode === 'add' ? 'create' : 'edit'}
            initialData={contract ? {
              ...contract,
              start_date: contract.start_date ? dayjs(contract.start_date).format('YYYY-MM-DD') : '',
              end_date: contract.end_date ? dayjs(contract.end_date).format('YYYY-MM-DD') : '',
              tenant_data: {
                name: contract.tenant.name,
                surname: contract.tenant.surname,
                phone: contract.tenant.phone || '',
                email: contract.tenant.email || '',
              }
            } : undefined}
            owners={owners}
            preselectedOwnerId={preselectedOwnerId}
            allowOwnerChange={mode === 'add' && !preselectedOwnerId}
            onSubmit={handleSubmit}
            isLoading={createContractMutation.isPending || updateContractMutation.isPending}
            submitLabel={mode === 'add' ? 'Aggiungi contratto' : 'Salva modifiche'}
            onDelete={mode === 'edit' ? () => setIsDeleteModalOpen(true) : undefined}
          />
        </div>
      )}

      {/* Delete Modal */}
      {contract && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Elimina contratto"
          message={`Sei sicuro di voler eliminare il contratto tra ${contract.owner.name} ${contract.owner.surname} e ${contract.tenant.name} ${contract.tenant.surname}? L'operazione sarà irreversibile.`}
          isLoading={deleteContractMutation.isPending}
        />
      )}
    </div>
  );
};

export default ContractDetailPage;

import { FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { 
  FaHome, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaFileContract,
  FaInfoCircle
} from 'react-icons/fa';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TenantForm from './TenantForm';
import type { Owner } from '../../types/owner';
import clsx from 'clsx';
import { useContractFormLogic, type ContractFormData } from './hooks/useContractFormLogic';

export type { ContractFormData };

interface ContractFormProps {
  initialData?: Partial<ContractFormData>;
  onSubmit: (data: ContractFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  owners: Owner[]; // Lista dei proprietari disponibili
  preselectedOwnerId?: number; // Proprietario preselezionato (es. da OwnerDetailPage)
  allowOwnerChange?: boolean; // Se false, il campo owner è readonly
  mode?: 'create' | 'edit' | 'renew' | 'annuity'; // Modalità del form
  minAnnuityYear?: number;
}

export default function ContractForm({
  initialData,
  onSubmit,
  onDelete,
  isLoading,
  submitLabel = 'Salva',
  owners,
  preselectedOwnerId,
  allowOwnerChange = true,
  mode = 'create',
  minAnnuityYear,
}: ContractFormProps) {

  const {
    methods,
    cedolareSecca,
    startDate,
    todayStr,
    isRenewDisabled,
    isFieldDisabled,
    errors,
    isDirty
  } = useContractFormLogic({
    initialData,
    preselectedOwnerId,
    mode,
    minAnnuityYear,
    isLoading
  });

  const { register, handleSubmit } = methods;

  // Log degli errori di validazione per debug istantaneo (come richiesto)
  const onInvalid = (errors: any) => {
    console.error('[FORM_ERROR] Validazione fallita:', errors);
  };

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={handleSubmit((data) => onSubmit(data as ContractFormData), onInvalid)} 
        className="space-y-8"
      >
        {/* Sezione Proprietario */}
        {mode !== 'renew' && mode !== 'annuity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-title">Dati proprietario</h3>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="owner_id" className="text-sm font-semibold text-text-title">
                Proprietario
              </label>
              <select
                id="owner_id"
                {...register('owner_id', { valueAsNumber: true })}
                disabled={!allowOwnerChange || isFieldDisabled('owner_id')}
                className={clsx(
                  'bg-bg-card border border-border rounded px-3 py-2 focus:outline-none focus:border-secondary transition-colors duration-300 w-full',
                  {
                    'border-red-500 focus:border-red-500': errors.owner_id,
                    'opacity-60 cursor-not-allowed': !allowOwnerChange || isFieldDisabled('owner_id'),
                  }
                )}
              >
                <option value={0}>Seleziona un proprietario</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} {owner.surname}
                  </option>
                ))}
              </select>
              {errors.owner_id && (
                <span className="text-xs text-red-500">{errors.owner_id.message}</span>
              )}
            </div>

            {/* Opzione per creare nuovo proprietario (da implementare con modal) */}
            {allowOwnerChange && mode === 'create' && (
              <p className="text-xs text-text-subtle italic">
                💡 Se il proprietario non è in elenco, aggiungilo {' '}
                <Link to="/owners" className="text-primary hover:underline font-semibold">
                  dalla pagina "Proprietari"
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Sezione Inquilino */}
        {mode !== 'renew' && mode !== 'annuity' && (
          <TenantForm disabled={isFieldDisabled('tenant_data')} />
        )}

        {/* Sezione Dati Contratto */}
        <div className="space-y-4">
          {mode !== 'annuity' && (
            <>
              <h3 className="text-lg font-bold text-text-title">Dati contratto</h3>

              {/* Indirizzo */}
              <Input
                label="Indirizzo immobile (opzionale)"
                name="address"
                register={register}
                error={errors.address?.message}
                placeholder="es. Via Roma 123, Milano"
                startIcon={<FaHome />}
                disabled={isFieldDisabled('address')}
              />

              {/* Durata Contratto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={mode === 'renew' ? "pointer-events-none opacity-70" : ""}>
                  <Input
                    label={mode === 'renew' ? "Data inizio (Originale)" : "Data inizio"}
                    name="start_date"
                    type="date"
                    register={register}
                    error={errors.start_date?.message}
                    startIcon={<FaCalendarAlt />}
                    disabled={isFieldDisabled('start_date')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    label="Data fine"
                    name="end_date"
                    type="date"
                    register={register}
                    error={errors.end_date?.message}
                    startIcon={<FaCalendarAlt />}
                    disabled={isFieldDisabled('end_date')}
                    min={mode === 'renew' ? todayStr : undefined}
                  />
                  {mode === 'renew' && (
                    <p className="text-[10px] text-text-subtle italic px-1">
                      * Il rinnovo deve estendere il contratto di almeno 30 giorni.
                    </p>
                  )}
                </div>
              </div>

              {/* Cedolare Secca */}
              <div className="flex items-center gap-3 p-4 bg-bg-card rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="cedolare_secca"
                  {...register('cedolare_secca')}
                  disabled={isFieldDisabled('cedolare_secca')}
                  className="w-5 h-5 text-primary bg-bg-card border-border rounded focus:ring-2 focus:ring-secondary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <label htmlFor="cedolare_secca" className="text-sm font-semibold text-text-title cursor-pointer">
                  Cedolare Secca
                </label>
              </div>

              {/* Tipologia */}
              <div className="flex flex-col gap-2">
                <label htmlFor="typology" className="text-sm font-semibold text-text-title">
                  Tipologia contratto
                </label>
                <select
                  id="typology"
                  {...register('typology')}
                  disabled={isFieldDisabled('typology')}
                  className={clsx(
                    'bg-bg-card border border-border rounded px-3 py-2 focus:outline-none focus:border-secondary transition-colors duration-300 w-full',
                    {
                      'border-red-500 focus:border-red-500': errors.typology,
                      'opacity-60 cursor-not-allowed': isFieldDisabled('typology'),
                    }
                  )}
                >
                  <option value="residenziale">Residenziale</option>
                  <option value="commerciale">Commerciale</option>
                </select>
                {errors.typology && (
                  <span className="text-xs text-red-500">{errors.typology.message}</span>
                )}
              </div>

              {/* Canone Concordato */}
              <div className="flex items-center gap-3 p-4 bg-bg-card rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="canone_concordato"
                  {...register('canone_concordato')}
                  disabled={isFieldDisabled('canone_concordato')}
                  className="w-5 h-5 text-primary bg-bg-card border-border rounded focus:ring-2 focus:ring-secondary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <label htmlFor="canone_concordato" className="text-sm font-semibold text-text-title cursor-pointer">
                  Canone Concordato
                </label>
              </div>

              {/* Canone Mensile */}
              <Input
                label="Canone mensile (€)"
                name="monthly_rent"
                type="number"
                register={register}
                error={errors.monthly_rent?.message}
                placeholder="es. 800"
                startIcon={<FaMoneyBillWave />}
                disabled={isFieldDisabled('monthly_rent')}
                step="0.01"
                min="0"
              />
            </>
          )}

          {/* Ultima Annualità Pagata - Solo se NON cedolare secca */}
          {!cedolareSecca && mode === 'renew' && (
            <div className="flex items-start gap-3 bg-bg-card p-3 rounded-lg border border-secondary">
              <span className="text-2xl shrink-0 text-secondary"><FaInfoCircle /></span>
              <p className="text-sm text-text-title leading-relaxed font-medium">
                Il pagamento dell'annualità viene aggiunto in automatico in base all'anno di rinnovo.
              </p>
            </div>
          )}
          {!cedolareSecca && mode !== 'renew' && mode !== 'annuity' && (
            <Input
              label="Ultima annualità pagata (Anno)"
              name="last_annuity_paid"
              type="number"
              register={register}
              error={errors.last_annuity_paid?.message}
              placeholder="es. 2025"
              startIcon={<FaFileContract />}
              disabled={isFieldDisabled('last_annuity_paid')}
              min={(
                mode === 'edit' && startDate
                  ? new Date(startDate).getFullYear()
                  : (minAnnuityYear || 2000)
              ).toString()}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col gap-3">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            disabled={(mode === 'edit' && !isDirty) || isRenewDisabled}
          >
            {submitLabel}
          </Button>

          {onDelete && (
            <Button
              type="button"
              variant="secondary"
              className="w-full text-error hover:text-error/80 border-none"
              onClick={onDelete}
              disabled={isLoading}
            >
              Elimina contratto
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

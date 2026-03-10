import { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FaHome, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaFileContract
} from 'react-icons/fa';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TenantForm from './TenantForm';
import type { Owner } from '../../types/owner';
import clsx from 'clsx';

// Schema di validazione per i dati dell'inquilino
const tenantDataSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
});

// Schema di validazione per il contratto come factory function per accettare parametri dinamici
const createContractSchema = (minAnnuityYear?: number) => z.object({
  owner_id: z.number().min(1, 'Seleziona un proprietario'),
  tenant_data: tenantDataSchema,
  address: z.string().min(1, 'L\'indirizzo è obbligatorio').trim(),
  start_date: z.string().min(1, 'La data di inizio è obbligatoria'),
  end_date: z.string().min(1, 'La data di fine è obbligatoria'),
  cedolare_secca: z.boolean(),
  typology: z.enum(['residenziale', 'commerciale'] as const),
  canone_concordato: z.boolean(),
  monthly_rent: z.any().transform(val => (val === '' || val === null || isNaN(val as any) ? undefined : Number(val))).pipe(
    z.number({ message: 'Il canone è obbligatorio' }).min(0, 'Il canone non può essere negativo')
  ),
  last_annuity_paid: z.any().transform(val => (val === '' || val === null || isNaN(val as any) ? null : Number(val))).pipe(
    z.number({ message: 'Inserire un anno valido' })
     .min(minAnnuityYear || 2000, `L'anno non può essere inferiore a ${minAnnuityYear || 2000}`)
     .nullable()
  ),
}).refine(
  (data) => {
    // Validazione: end_date deve essere dopo start_date
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'La data di fine deve essere successiva alla data di inizio',
    path: ['end_date'],
  }
).refine(
  (data) => {
    // Se NON è cedolare secca, l'ultima annualità pagata è OBBLIGATORIA
    if (!data.cedolare_secca && data.last_annuity_paid === null) {
      return false;
    }
    return true;
  },
  {
    message: "Devi inserire obbligatoriamente l'annualità per procedere!",
    path: ['last_annuity_paid'],
  }
);

export type ContractFormData = z.infer<ReturnType<typeof createContractSchema>>;

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

/**
 * ContractForm - Form complesso per la gestione dei contratti
 * 
 * Supporta diverse modalità:
 * - create: Creazione nuovo contratto (tutti i campi editabili)
 * - edit: Modifica contratto esistente (tutti i campi editabili)
 * - renew: Rinnovo contratto (solo dati contratto editabili)
 * - annuity: Rinnovo annualità (solo last_annuity_paid editabile)
 * 
 * @param initialData Dati iniziali per pre-compilare il form
 * @param onSubmit Callback chiamata al submit del form validato
 * @param onDelete Callback per eliminazione (opzionale)
 * @param isLoading Stato di caricamento
 * @param submitLabel Testo personalizzato per il pulsante di submit
 * @param owners Lista dei proprietari disponibili
 * @param preselectedOwnerId ID del proprietario preselezionato
 * @param allowOwnerChange Se false, il campo owner è readonly
 * @param mode Modalità del form (default: 'create')
 */
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

  const schema = useMemo(() => createContractSchema(minAnnuityYear), [minAnnuityYear]);

  const methods = useForm<ContractFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      owner_id: preselectedOwnerId || initialData?.owner_id || 0,
      tenant_data: {
        name: initialData?.tenant_data?.name || '',
        surname: initialData?.tenant_data?.surname || '',
        phone: initialData?.tenant_data?.phone || '',
        email: initialData?.tenant_data?.email || '',
      },
      address: initialData?.address || '',
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      cedolare_secca: initialData?.cedolare_secca ?? true,
      typology: initialData?.typology || 'residenziale',
      canone_concordato: initialData?.canone_concordato ?? false,
      monthly_rent: initialData?.monthly_rent || 0,
      last_annuity_paid: initialData?.last_annuity_paid || null,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = methods;

  // Watch per cedolare_secca per mostrare/nascondere last_annuity_paid
  const cedolareSecca = watch('cedolare_secca');

  // Imposta il proprietario preselezionato se cambia
  useEffect(() => {
    if (preselectedOwnerId) {
      setValue('owner_id', preselectedOwnerId);
    }
  }, [preselectedOwnerId, setValue]);

  // Determina quali campi sono editabili in base alla modalità
  const isFieldDisabled = (fieldName: string) => {
    if (isLoading) return true;
    
    switch (mode) {
      case 'renew':
        // In modalità rinnovo, solo i dati del contratto sono editabili
        return !['address', 'start_date', 'end_date', 'cedolare_secca', 'typology', 'canone_concordato', 'monthly_rent', 'last_annuity_paid'].includes(fieldName);
      
      case 'annuity':
        // In modalità annualità, solo last_annuity_paid è editabile
        return fieldName !== 'last_annuity_paid';
      
      case 'edit':
      case 'create':
      default:
        // In modalità edit/create, tutti i campi sono editabili
        return false;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

            {/* TODO: Opzione per creare nuovo proprietario (da implementare con modal) */}
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
                label="Indirizzo immobile"
                name="address"
                register={register}
                error={errors.address?.message}
                placeholder="es. Via Roma 123, Milano"
                startIcon={<FaHome />}
                disabled={isFieldDisabled('address')}
              />

              {/* Durata Contratto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Data inizio"
                  name="start_date"
                  type="date"
                  register={register}
                  error={errors.start_date?.message}
                  startIcon={<FaCalendarAlt />}
                  disabled={isFieldDisabled('start_date')}
                />
                <Input
                  label="Data fine"
                  name="end_date"
                  type="date"
                  register={register}
                  error={errors.end_date?.message}
                  startIcon={<FaCalendarAlt />}
                  disabled={isFieldDisabled('end_date')}
                />
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
          {!cedolareSecca && (
            <div className={clsx(mode === 'annuity' ? "space-y-4" : "")}>
              <Input
                label={mode === 'annuity' ? "Inserisci l'anno dell'annualità rinnovata per confermare:" : "Ultima annualità pagata (Anno)"}
                name="last_annuity_paid"
                type="number"
                register={register}
                error={errors.last_annuity_paid?.message}
                placeholder="es. 2025"
                startIcon={<FaFileContract />}
                disabled={isFieldDisabled('last_annuity_paid')}
                min={minAnnuityYear?.toString() || "2000"}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col gap-3">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            disabled={mode === 'edit' && !isDirty}
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

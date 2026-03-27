import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const tenantDataSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
});

export const createContractSchema = (minAnnuityYear?: number) => z.object({
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

interface UseContractFormLogicProps {
  initialData?: Partial<ContractFormData>;
  preselectedOwnerId?: number;
  mode: 'create' | 'edit' | 'renew' | 'annuity';
  minAnnuityYear?: number;
  isLoading?: boolean;
}

export const useContractFormLogic = ({
  initialData,
  preselectedOwnerId,
  mode,
  minAnnuityYear,
  isLoading
}: UseContractFormLogicProps) => {

  const effectiveMinAnnuityYear = useMemo(() => {
    if (mode === 'edit' && initialData?.start_date) {
      const year = new Date(initialData.start_date).getFullYear();
      if (!isNaN(year)) return year;
    }
    return minAnnuityYear;
  }, [mode, initialData?.start_date, minAnnuityYear]);

  const schema = useMemo(() => createContractSchema(effectiveMinAnnuityYear), [effectiveMinAnnuityYear]);

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

  const { watch, setValue, formState: { errors, isDirty } } = methods;

  const cedolareSecca = watch('cedolare_secca');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  const isRenewDisabled = useMemo(() => {
    if (mode !== 'renew') return false;
    if (!startDate || !endDate) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start < today || end < today) return true;
    if (start >= end) return true;
    
    return false;
  }, [mode, startDate, endDate]);

  useEffect(() => {
    if (mode === 'renew' && !cedolareSecca && startDate) {
      const year = new Date(startDate).getFullYear();
      if (!isNaN(year)) {
        setValue('last_annuity_paid', year, { shouldDirty: true });
      }
    }
  }, [mode, cedolareSecca, startDate, setValue]);

  useEffect(() => {
    if (preselectedOwnerId) {
      setValue('owner_id', preselectedOwnerId);
    }
  }, [preselectedOwnerId, setValue]);

  const isFieldDisabled = (fieldName: string) => {
    if (isLoading) return true;
    switch (mode) {
      case 'renew':
        return !['address', 'start_date', 'end_date', 'cedolare_secca', 'typology', 'canone_concordato', 'monthly_rent', 'last_annuity_paid'].includes(fieldName);
      case 'annuity':
        return fieldName !== 'last_annuity_paid';
      case 'edit':
      case 'create':
      default:
        return false;
    }
  };

  return {
    methods,
    cedolareSecca,
    startDate,
    todayStr,
    isRenewDisabled,
    isFieldDisabled,
    errors,
    isDirty
  };
};

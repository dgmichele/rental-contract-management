import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContractSchema, type ContractFormData } from '../../../schemas/contract.schema';

export type { ContractFormData };

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
    
    if (end < today) return true;
    if (start >= end) return true;

    // Controllo estensione minima 30 giorni rispetto alla vecchia end_date
    if (initialData?.end_date) {
      const oldEnd = new Date(initialData.end_date);
      const diffMs = end.getTime() - oldEnd.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 30) return true;
    }
    
    return false;
  }, [mode, startDate, endDate, initialData?.end_date]);

  useEffect(() => {
    if (mode === 'renew') {
      if (!cedolareSecca) {
        const year = new Date().getFullYear();
        setValue('last_annuity_paid', year, { shouldDirty: true });
        console.log('[FORM_LOGIC] Regime ordinario rilevato, impostato last_annuity_paid:', year);
      } else {
        setValue('last_annuity_paid', null, { shouldDirty: true });
        console.log('[FORM_LOGIC] Cedolare secca rilevata, resettato last_annuity_paid a null');
      }
    }
  }, [mode, cedolareSecca, setValue]);

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

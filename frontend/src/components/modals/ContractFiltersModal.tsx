import React from 'react';
import { useForm } from 'react-hook-form';
import BaseModal from './BaseModal';
import Button from '../ui/Button';

interface ContractFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { expiryMonth?: number; expiryYear?: number }) => void;
  currentFilters: { expiryMonth?: number; expiryYear?: number };
}

interface FilterFormData {
  expiryMonth: string;
  expiryYear: string;
}

const ContractFiltersModal: React.FC<ContractFiltersModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const { register, handleSubmit, reset } = useForm<FilterFormData>({
    defaultValues: {
      expiryMonth: currentFilters.expiryMonth?.toString() || '',
      expiryYear: currentFilters.expiryYear?.toString() || '',
    },
  });

  // Reset form when modal opens with current filters
  React.useEffect(() => {
    if (isOpen) {
      reset({
        expiryMonth: currentFilters.expiryMonth?.toString() || '',
        expiryYear: currentFilters.expiryYear?.toString() || '',
      });
    }
  }, [isOpen, currentFilters, reset]);

  const onSubmit = (data: FilterFormData) => {
    const filters = {
      expiryMonth: data.expiryMonth ? parseInt(data.expiryMonth) : undefined,
      expiryYear: data.expiryYear ? parseInt(data.expiryYear) : undefined,
    };
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    reset({ expiryMonth: '', expiryYear: '' });
    onApplyFilters({ expiryMonth: undefined, expiryYear: undefined });
    onClose();
  };

  // Generate years (current year - 1 to current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Filtra Contratti" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="expiryMonth" className="text-sm font-semibold text-text-title">
              Mese di Scadenza
            </label>
            <select
              id="expiryMonth"
              {...register('expiryMonth')}
              className="bg-bg-card border border-border rounded px-3 py-2 focus:outline-none focus:border-secondary transition-colors duration-300 w-full"
            >
              <option value="">Tutti i mesi</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('it-IT', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="expiryYear" className="text-sm font-semibold text-text-title">
              Anno di Scadenza
            </label>
            <select
              id="expiryYear"
              {...register('expiryYear')}
              className="bg-bg-card border border-border rounded px-3 py-2 focus:outline-none focus:border-secondary transition-colors duration-300 w-full"
            >
              <option value="">Tutti gli anni</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-border">
          <Button type="submit" variant="primary" className="w-full">
            Applica Filtri
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            className="w-full"
          >
            Resetta Filtri
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ContractFiltersModal;

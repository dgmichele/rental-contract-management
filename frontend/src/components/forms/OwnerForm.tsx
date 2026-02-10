import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import Input from '../ui/Input';
import Button from '../ui/Button';

// Schema di validazione Zod per il proprietario
const ownerSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().min(1, "L'email è obbligatoria").email('Email non valida').toLowerCase().trim(),
});

export type OwnerFormData = z.infer<typeof ownerSchema>;

interface OwnerFormProps {
  initialData?: Partial<OwnerFormData>;
  onSubmit: (data: OwnerFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * Form per la creazione e modifica di un Proprietario.
 * Gestisce la validazione tramite Zod e react-hook-form.
 * 
 * @param initialData Dati iniziali per pre-compilare il form (modalità edit)
 * @param onSubmit Callback chiamata al submit del form validato
 * @param isLoading Stato di caricamento per il pulsante di submit
 * @param submitLabel Testo personalizzato per il pulsante di submit
 */
export default function OwnerForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = 'Salva',
}: OwnerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome */}
        <Input
          label="Nome"
          name="name"
          register={register}
          error={errors.name?.message}
          placeholder="es. Mario"
          startIcon={<FaUser />}
          disabled={isLoading}
        />

        {/* Cognome */}
        <Input
          label="Cognome"
          name="surname"
          register={register}
          error={errors.surname?.message}
          placeholder="es. Rossi"
          startIcon={<FaUser />}
          disabled={isLoading}
        />
      </div>

      {/* Email */}
      <Input
        label="Email"
        name="email"
        type="email"
        register={register}
        error={errors.email?.message}
        placeholder="es. mario.rossi@email.it"
        startIcon={<FaEnvelope />}
        disabled={isLoading}
      />

      {/* Telefono */}
      <Input
        label="Telefono (opzionale)"
        name="phone"
        register={register}
        error={errors.phone?.message}
        placeholder="es. 333 1234567"
        startIcon={<FaPhone />}
        disabled={isLoading}
      />

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
          disabled={!isDirty && !!initialData} // Disabilita se non ci sono modifiche in modalità edit
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

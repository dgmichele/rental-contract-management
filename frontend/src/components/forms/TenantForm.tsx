import { useFormContext } from 'react-hook-form';
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import Input from '../ui/Input';

/**
 * TenantForm - Nested form component per i dati dell'inquilino
 * 
 * Questo componente è pensato per essere utilizzato all'interno di ContractForm.
 * Utilizza useFormContext per accedere al form parent invece di creare un nuovo form.
 * 
 * I campi sono prefissati con "tenant_data." per integrarsi correttamente
 * con la struttura dati del contratto.
 */
export default function TenantForm({ disabled = false }: { disabled?: boolean }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Accesso agli errori nested per tenant_data
  const tenantErrors = errors.tenant_data as any;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-title mb-4">Dati Inquilino</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome Inquilino */}
        <Input
          label="Nome"
          name="tenant_data.name"
          register={register}
          error={tenantErrors?.name?.message}
          placeholder="es. Luca"
          startIcon={<FaUser />}
          disabled={disabled}
        />

        {/* Cognome Inquilino */}
        <Input
          label="Cognome"
          name="tenant_data.surname"
          register={register}
          error={tenantErrors?.surname?.message}
          placeholder="es. Bianchi"
          startIcon={<FaUser />}
          disabled={disabled}
        />
      </div>

      {/* Email Inquilino */}
      <Input
        label="Email (opzionale)"
        name="tenant_data.email"
        type="email"
        register={register}
        error={tenantErrors?.email?.message}
        placeholder="es. luca.bianchi@email.it"
        startIcon={<FaEnvelope />}
        disabled={disabled}
      />

      {/* Telefono Inquilino */}
      <Input
        label="Telefono (opzionale)"
        name="tenant_data.phone"
        register={register}
        error={tenantErrors?.phone?.message}
        placeholder="es. 333 7654321"
        startIcon={<FaPhone />}
        disabled={disabled}
      />
    </div>
  );
}

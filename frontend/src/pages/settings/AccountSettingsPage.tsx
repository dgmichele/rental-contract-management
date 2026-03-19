import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUser, FiMail, FiLock, FiSave } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { useUpdateDetails, useUpdatePassword } from '../../hooks/useUser';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// ============= SCHEMI DI VALIDAZIONE =============

const detailsSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  surname: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Inserisci la password attuale'),
  newPassword: z.string().min(8, 'La nuova password deve avere almeno 8 caratteri'),
  confirmPassword: z.string().min(1, 'Conferma la nuova password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type DetailsFormValues = z.infer<typeof detailsSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

/**
 * PAGE - IMPOSTAZIONI ACCOUNT
 * Permette all'utente di aggiornare i propri dati personali e la password.
 */
export default function AccountSettingsPage() {
  const { user } = useAuthStore();
  const updateDetailsMutation = useUpdateDetails();
  const updatePasswordMutation = useUpdatePassword();

  // ============= FORM AGGIORNA DATI =============
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    reset: resetDetails,
    formState: { errors: detailsErrors, isDirty: isDetailsDirty },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
    },
  });

  // Aggiorna i valori del form se l'utente cambia nello stato (es. dopo update successo)
  useEffect(() => {
    if (user) {
      resetDetails({
        name: user.name,
        surname: user.surname,
        email: user.email,
      });
    }
  }, [user, resetDetails]);

  const onUpdateDetails = (data: DetailsFormValues) => {
    updateDetailsMutation.mutate(data);
  };

  // ============= FORM AGGIORNA PASSWORD =============
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const confirmPassword = watchPassword('confirmPassword');
  // Il pulsante salva è attivo quando "ripeti password" ha almeno 1 carattere come da AGENTS.md
  const isPasswordSubmitEnabled = confirmPassword && confirmPassword.length > 0;

  const onUpdatePassword = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }, {
      onSuccess: () => resetPassword(),
    });
  };

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-title">
            Impostazioni Account
          </h1>
          <p className="text-text-body mt-2">
            Gestisci le tue informazioni personali e la sicurezza dell'account.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* SEZIONE AGGIORNA DATI */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUser className="text-primary text-xl" />
              <h2 className="text-xl font-heading font-bold text-text-title">
                Aggiorna dati
              </h2>
            </div>
            
            <Card className="p-6">
              <form onSubmit={handleSubmitDetails(onUpdateDetails)} className="space-y-4">
                <Input
                  label="Nome"
                  name="name"
                  register={registerDetails}
                  error={detailsErrors.name?.message}
                  startIcon={<FiUser />}
                />
                <Input
                  label="Cognome"
                  name="surname"
                  register={registerDetails}
                  error={detailsErrors.surname?.message}
                  startIcon={<FiUser />}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  register={registerDetails}
                  error={detailsErrors.email?.message}
                  startIcon={<FiMail />}
                />
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center gap-2"
                    disabled={!isDetailsDirty || updateDetailsMutation.isPending}
                    isLoading={updateDetailsMutation.isPending}
                  >
                    <FiSave className="text-lg" />
                    Salva
                  </Button>
                </div>
              </form>
            </Card>
          </section>

          {/* SEZIONE AGGIORNA PASSWORD */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FiLock className="text-primary text-xl" />
              <h2 className="text-xl font-heading font-bold text-text-title">
                Aggiorna password
              </h2>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-4">
                <Input
                  label="Password attuale"
                  name="currentPassword"
                  type="password"
                  register={registerPassword}
                  error={passwordErrors.currentPassword?.message}
                  startIcon={<FiLock />}
                  placeholder="********"
                />
                <Input
                  label="Nuova password"
                  name="newPassword"
                  type="password"
                  register={registerPassword}
                  error={passwordErrors.newPassword?.message}
                  startIcon={<FiLock />}
                  placeholder="Almeno 8 caratteri"
                />
                <Input
                  label="Ripeti nuova password"
                  name="confirmPassword"
                  type="password"
                  register={registerPassword}
                  error={passwordErrors.confirmPassword?.message}
                  startIcon={<FiLock />}
                  placeholder="Verifica la password"
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center gap-2"
                    disabled={!isPasswordSubmitEnabled || updatePasswordMutation.isPending}
                    isLoading={updatePasswordMutation.isPending}
                  >
                    <FiSave className="text-lg" />
                    Salva
                  </Button>
                </div>
              </form>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

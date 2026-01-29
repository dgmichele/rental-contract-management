import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiLock, FiCheck } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

/**
 * VALIDATION SCHEMA - RESET PASSWORD
 */
const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(1, 'Password obbligatoria')
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La password deve contenere almeno una maiuscola, una minuscola e un numero'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Conferma password obbligatoria'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * PAGE - RESET PASSWORD
 * Form per reimpostare password usando token da URL.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isResettingPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      return;
    }

    resetPassword({
      token,
      newPassword: data.newPassword,
    });
  };

  // Se non c'è token, mostra errore
  if (!token) {
    return (
      <div className="min-h-screen flex justify-center bg-bg-main px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-heading font-bold text-red-800 mb-4">
              Link non valido
            </h1>
            <p className="text-red-700 mb-6">
              Il link per il reset della password non è valido o è scaduto.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-smooth"
            >
              Richiedi nuovo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-bg-main px-4 py-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-text-title mb-3">
            Reimposta password
          </h1>
          <p className="text-text-body">
            Scegli una nuova password per il tuo account.
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <Input
              label="Nuova password"
              type="password"
              placeholder="••••••••"
              name="newPassword"
              register={register}
              error={errors.newPassword?.message}
              startIcon={<FiLock size={20} />}
            />

            {/* Confirm Password */}
            <Input
              label="Conferma nuova password"
              type="password"
              placeholder="••••••••"
              name="confirmPassword"
              register={register}
              error={errors.confirmPassword?.message}
              startIcon={<FiLock size={20} />}
            />

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Requisiti password:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center gap-2">
                  <FiCheck size={16} className="text-blue-600" />
                  Almeno 8 caratteri
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck size={16} className="text-blue-600" />
                  Almeno una lettera maiuscola
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck size={16} className="text-blue-600" />
                  Almeno una lettera minuscola
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck size={16} className="text-blue-600" />
                  Almeno un numero
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isResettingPassword}
              className="w-full"
            >
              {isResettingPassword ? 'Reimpostazione in corso...' : <>Reimposta password <FiCheck size={20} /></>}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiLock, FiCheck } from 'react-icons/fi';

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
        <div className="bg-bg-card border border-border rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-text-title mb-2"
              >
                Nuova password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-text-subtle" size={20} />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('newPassword')}
                  className={`
                    w-full pl-10 pr-4 py-3 
                    border rounded-lg 
                    bg-white
                    text-text-body
                    placeholder:text-text-subtle
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-smooth
                    ${errors.newPassword ? 'border-red-500' : 'border-border'}
                  `}
                  placeholder="••••••••"
                />
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-text-title mb-2"
              >
                Conferma nuova password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-text-subtle" size={20} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`
                    w-full pl-10 pr-4 py-3 
                    border rounded-lg 
                    bg-white
                    text-text-body
                    placeholder:text-text-subtle
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-smooth
                    ${errors.confirmPassword ? 'border-red-500' : 'border-border'}
                  `}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

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
            <button
              type="submit"
              disabled={isResettingPassword}
              className="
                w-full py-3 px-4
                bg-primary hover:bg-primary-hover
                text-white font-semibold
                rounded-lg
                flex items-center justify-center gap-2
                transition-smooth
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
              "
            >
              {isResettingPassword ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reimpostazione in corso...
                </>
              ) : (
                <>
                  Reimposta password
                  <FiCheck size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

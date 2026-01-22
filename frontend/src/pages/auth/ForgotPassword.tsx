import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

/**
 * VALIDATION SCHEMA - FORGOT PASSWORD
 */
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email obbligatoria')
    .email('Email non valida'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * PAGE - FORGOT PASSWORD
 * Form per richiedere reset password via email.
 */
export default function ForgotPassword() {
  const { forgotPassword, isSendingResetEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data);
  };

  return (
    <div className="min-h-screen flex justify-center bg-bg-main px-4 py-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-text-title mb-2">
            Password dimenticata?
          </h1>
          <p className="text-text-body">
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-bg-card border border-border rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-text-title mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-text-subtle" size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`
                    w-full pl-10 pr-4 py-3 
                    border rounded-lg 
                    bg-white
                    text-text-body
                    placeholder:text-text-subtle
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-smooth
                    ${errors.email ? 'border-red-500' : 'border-border'}
                  `}
                  placeholder="mario.rossi@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSendingResetEmail}
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
              {isSendingResetEmail ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  Invia link di reset
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-link hover:text-primary-hover font-semibold transition-smooth"
            >
              <FiArrowLeft size={16} />
              Torna al Login
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-bg-card border border-secondary rounded-lg p-4 shadow-sm">
          <p className="text-sm text-text-title">
            <strong>Nota:</strong> Se l'email esiste nel nostro sistema, riceverai un link per reimpostare la password. Il link sarà valido per 1 ora.
          </p>
        </div>
      </div>
    </div>
  );
}

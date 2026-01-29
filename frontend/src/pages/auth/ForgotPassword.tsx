import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

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
  const { forgotPasswordAsync, isSendingResetEmail } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordAsync(data);
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (message === 'Email non registrata') {
        setError('email', { type: 'manual', message: 'Email non registrata' });
      }
    }
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
        <Card className="shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="mario.rossi@example.com"
              name="email"
              register={register}
              error={errors.email?.message}
              startIcon={<FiMail size={20} />}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isSendingResetEmail}
              className="w-full"
            >
              {isSendingResetEmail ? 'Invio in corso...' : 'Invia link di reset'}
            </Button>
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
        </Card>

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

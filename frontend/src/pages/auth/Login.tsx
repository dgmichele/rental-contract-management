import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { loginSchema, type LoginFormData } from '../../schemas/auth.schema';


/**
 * PAGE - LOGIN
 * Form di login con validazione Zod + React Hook Form.
 */
export default function Login() {
  const { loginAsync, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginAsync(data);
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (message === 'Email non trovata') {
        setError('email', { type: 'manual', message: 'Email non trovata' });
      } else if (message === 'Password errata') {
        setError('password', { type: 'manual', message: 'Password errata' });
      }
    }
  };

  return (
    <AuthLayout 
      title="Bentornato" 
      subtitle="Accedi al tuo account per gestire i tuoi contratti."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="mario.rossi@example.com"
          name="email"
          register={register}
          error={errors.email?.message}
          startIcon={<FiMail size={20} />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          name="password"
          register={register}
          error={errors.password?.message}
          startIcon={<FiLock size={20} />}
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-link hover:text-primary-hover transition-smooth"
          >
            Password dimenticata?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoggingIn}
          className="w-full"
        >
          Accedi <FiLogIn size={20} />
        </Button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-text-body">
          Non hai un account?{' '}
          <Link
            to="/register"
            className="text-link hover:text-primary-hover font-semibold transition-smooth"
          >
            Registrati
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

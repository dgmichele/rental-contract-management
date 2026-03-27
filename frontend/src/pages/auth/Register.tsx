import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiUserPlus, FiMail, FiLock } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { registerSchema, type RegisterFormData } from '../../schemas/auth.schema';


/**
 * PAGE - REGISTER
 * Form di registrazione con validazione Zod + React Hook Form.
 */
export default function Register() {
  const { registerAsync: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    // Rimuovi confirmPassword prima di inviare al backend
    const { confirmPassword, ...registerData } = data;
    
    try {
      await registerUser(registerData);
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (message === 'Email già registrata') {
        setError('email', { type: 'manual', message: 'Email già in uso' });
      }
    }
  };

  return (
    <AuthLayout 
      title="Crea account" 
      subtitle="Registrati per iniziare a gestire i tuoi contratti."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Nome */}
          <Input
            label="Nome"
            type="text"
            placeholder="Mario"
            name="name"
            register={register}
            error={errors.name?.message}
            startIcon={<FiUser size={20} />}
          />

          {/* Cognome */}
          <Input
            label="Cognome"
            type="text"
            placeholder="Rossi"
            name="surname"
            register={register}
            error={errors.surname?.message}
            startIcon={<FiUser size={20} />}
          />
        </div>

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

        {/* Password */}
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          name="password"
          register={register}
          error={errors.password?.message}
          startIcon={<FiLock size={20} />}
        />

        {/* Confirm Password */}
        <Input
          label="Conferma Password"
          type="password"
          placeholder="••••••••"
          name="confirmPassword"
          register={register}
          error={errors.confirmPassword?.message}
          startIcon={<FiLock size={20} />}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isRegistering}
          className="w-full"
        >
          Registrati <FiUserPlus size={20} />
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-text-body">
          Hai già un account?{' '}
          <Link
            to="/login"
            className="text-link hover:text-primary-hover font-semibold transition-smooth"
          >
            Accedi
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

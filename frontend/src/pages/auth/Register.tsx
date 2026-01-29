import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiUserPlus, FiMail, FiLock } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import logo from '../../assets/images/logo-orizzontale.png';

/**
 * VALIDATION SCHEMA - REGISTER
 */
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome obbligatorio')
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(50, 'Il nome non può superare 50 caratteri'),
  surname: z
    .string()
    .min(1, 'Cognome obbligatorio')
    .min(2, 'Il cognome deve contenere almeno 2 caratteri')
    .max(50, 'Il cognome non può superare 50 caratteri'),
  email: z
    .string()
    .min(1, 'Email obbligatoria')
    .email('Email non valida'),
  password: z
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
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

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
    <div className="min-h-screen flex justify-center bg-bg-main px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Bich Immobiliare" 
            className="h-16 mx-auto mb-10"
          />
          <h1 className="text-4xl font-heading font-bold text-text-title mb-2">
            Crea account
          </h1>
          <p className="text-text-body">
            Registrati per iniziare a gestire i tuoi contratti.
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-sm p-8">
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
        </Card>
      </div>
    </div>
  );
}

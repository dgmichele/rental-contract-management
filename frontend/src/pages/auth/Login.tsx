import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import logo from '../../assets/images/logo-orizzontale.png';

/**
 * VALIDATION SCHEMA - LOGIN
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email obbligatoria')
    .email('Email non valida'),
  password: z
    .string()
    .min(1, 'Password obbligatoria')
    .min(8, 'La password deve contenere almeno 8 caratteri'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * PAGE - LOGIN
 * Form di login con validazione Zod + React Hook Form.
 */
export default function Login() {
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
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
          <h1 className="text-4xl font-heading font-bold text-text-title mb-4">
            Bentornato
          </h1>
          <p className="text-text-body">
            Accedi al tuo account per gestire i tuoi contratti.
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

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-text-title mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-text-subtle" size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`
                    w-full pl-10 pr-4 py-3 
                    border rounded-lg 
                    bg-white
                    text-text-body
                    placeholder:text-text-subtle
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-smooth 
                    ${errors.password ? 'border-red-500' : 'border-border'}
                  `}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

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
            <button
              type="submit"
              disabled={isLoggingIn}
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
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  Accedi
                  <FiLogIn size={20} />
                </>
              )}
            </button>
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
        </div>
      </div>
    </div>
  );
}

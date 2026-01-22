import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
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
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    // Rimuovi confirmPassword prima di inviare al backend
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData);
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
        <div className="bg-bg-card border border-border rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-text-title mb-2"
                >
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-text-subtle" size={20} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    autoComplete="given-name"
                    {...register('name')}
                    className={`
                      w-full pl-10 pr-4 py-3 
                      border rounded-lg 
                      bg-white
                      text-text-body
                      placeholder:text-text-subtle
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      transition-smooth
                      ${errors.name ? 'border-red-500' : 'border-border'}
                    `}
                    placeholder="Mario"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Cognome */}
              <div>
                <label
                  htmlFor="surname"
                  className="block text-sm font-semibold text-text-title mb-2"
                >
                  Cognome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-text-subtle" size={20} />
                  </div>
                  <input
                    id="surname"
                    type="text"
                    autoComplete="family-name"
                    {...register('surname')}
                    className={`
                      w-full pl-10 pr-4 py-3 
                      border rounded-lg 
                      bg-white
                      text-text-body
                      placeholder:text-text-subtle
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      transition-smooth
                      ${errors.surname ? 'border-red-500' : 'border-border'}
                    `}
                    placeholder="Rossi"
                  />
                </div>
                {errors.surname && (
                  <p className="mt-1 text-sm text-red-600">{errors.surname.message}</p>
                )}
              </div>
            </div>

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
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-text-title mb-2"
              >
                Conferma Password
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRegistering}
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
              {isRegistering ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registrazione in corso...
                </>
              ) : (
                <>
                  Registrati
                  <FiUserPlus size={20} />
                </>
              )}
            </button>
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
        </div>
      </div>
    </div>
  );
}

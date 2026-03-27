import { z } from 'zod';
import { passwordComplexitySchema } from './user.schema';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email obbligatoria')
    .email('Email non valida'),
  password: z
    .string()
    .min(1, 'Password obbligatoria')
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
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
  password: passwordComplexitySchema,
  confirmPassword: z
    .string()
    .min(1, 'Conferma password obbligatoria'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

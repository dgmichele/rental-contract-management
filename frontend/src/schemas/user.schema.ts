import { z } from 'zod';

export const passwordComplexitySchema = z
  .string()
  .min(1, 'Password obbligatoria')
  .min(8, 'La password deve contenere almeno 8 caratteri')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'La password deve contenere almeno una maiuscola, una minuscola e un numero'
  );

export const detailsSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  surname: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Inserisci la password attuale'),
  newPassword: passwordComplexitySchema,
  confirmPassword: z.string().min(1, 'Conferma la nuova password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

export type DetailsFormValues = z.infer<typeof detailsSchema>;
export type PasswordFormValues = z.infer<typeof passwordUpdateSchema>;

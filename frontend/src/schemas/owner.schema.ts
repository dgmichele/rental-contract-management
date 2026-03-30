import { z } from 'zod';

export const ownerSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email non valida').toLowerCase().trim().optional().or(z.literal('')),
});

export type OwnerFormData = z.infer<typeof ownerSchema>;

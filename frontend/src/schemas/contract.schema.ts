import { z } from 'zod';

export const tenantDataSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
});

export const createContractSchema = (minAnnuityYear?: number) => z.object({
  owner_id: z.number().min(1, 'Seleziona un proprietario'),
  tenant_data: tenantDataSchema,
  address: z.string().min(1, 'L\'indirizzo è obbligatorio').trim(),
  start_date: z.string().min(1, 'La data di inizio è obbligatoria'),
  end_date: z.string().min(1, 'La data di fine è obbligatoria'),
  cedolare_secca: z.boolean(),
  typology: z.enum(['residenziale', 'commerciale'] as const),
  canone_concordato: z.boolean(),
  monthly_rent: z.any().transform(val => (val === '' || val === null || isNaN(val as any) ? undefined : Number(val))).pipe(
    z.number({ message: 'Il canone è obbligatorio' }).min(0, 'Il canone non può essere negativo')
  ),
  last_annuity_paid: z.any().transform(val => (val === '' || val === null || isNaN(val as any) ? null : Number(val))).pipe(
    z.number({ message: 'Inserire un anno valido' })
     .min(minAnnuityYear || 2000, `L'anno non può essere inferiore a ${minAnnuityYear || 2000}`)
     .nullable()
  ),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'La data di fine deve essere successiva alla data di inizio',
    path: ['end_date'],
  }
).refine(
  (data) => {
    if (!data.cedolare_secca && data.last_annuity_paid === null) {
      return false;
    }
    return true;
  },
  {
    message: "Devi inserire obbligatoriamente l'annualità per procedere!",
    path: ['last_annuity_paid'],
  }
);

export type ContractFormData = z.infer<ReturnType<typeof createContractSchema>>;

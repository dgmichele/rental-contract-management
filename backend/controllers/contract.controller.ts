import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as contractService from '../services/contract.service';
import * as annuityService from '../services/annuity.service';
// AGGIUNTO RenewAnnuityBody
import { CreateContractBody, RenewAnnuityBody } from '../types/api'; 
import { AuthenticatedRequest } from '../types/express';
import AppError from '../utils/AppError';

// ============= ZOD SCHEMAS =============

/**
 * Schema per dati tenant nuovo (nested creation)
 */
const tenantDataSchema = z.object({
  name: z.string().min(1, 'Nome inquilino obbligatorio').trim(),
  surname: z.string().min(1, 'Cognome inquilino obbligatorio').trim(),
  phone: z.string().optional(),
  email: z.string().email('Email inquilino non valida').optional(),
});

/**
 * Schema per aggiornamento dati tenant (tutti campi opzionali)
 */
const updateTenantDataSchema = z.object({
  name: z.string().min(1, 'Nome inquilino non può essere vuoto').trim().optional(),
  surname: z.string().min(1, 'Cognome inquilino non può essere vuoto').trim().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inquilino non valida').optional(),
});

/**
 * Schema validazione creazione contratto.
 * Validazione custom: end_date deve essere successiva a start_date.
 * Accetta tenant_id (esistente) OPPURE tenant_data (nuovo).
 */
const createContractSchema = z
  .object({
    owner_id: z.number().int().positive('Owner ID deve essere positivo'),
    tenant_id: z.number().int().positive().optional(),
    tenant_data: tenantDataSchema.optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
    cedolare_secca: z.boolean(),
    typology: z.enum(['residenziale', 'commerciale'] as const, { error: 'Tipologia deve essere residenziale o commerciale' }),
    canone_concordato: z.boolean(),
    monthly_rent: z.number().positive('Canone mensile deve essere positivo'),
    last_annuity_paid: z.number().int().nullable().optional(),
    address: z.string().max(255, 'Indirizzo troppo lungo').optional(),
  })
  .refine(
    (data) => {
      // Validazione custom: end_date > start_date
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end > start;
    },
    {
      message: 'La data di fine deve essere successiva alla data di inizio',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Deve avere tenant_id OPPURE tenant_data, non entrambi
      return (data.tenant_id && !data.tenant_data) || (!data.tenant_id && data.tenant_data);
    },
    {
      message: 'Fornire tenant_id (esistente) o tenant_data (nuovo), non entrambi',
      path: ['tenant_id'],
    }
  );

/**
 * Schema validazione aggiornamento contratto.
 * Tutti i campi opzionali. Validazione date solo se entrambe fornite.
 * ⭐ AGGIUNTO: tenant_data per permettere update dati inquilino
 */
const updateContractSchema = z
  .object({
    owner_id: z.number().int().positive().optional(),
    tenant_id: z.number().int().positive().optional(),
    tenant_data: updateTenantDataSchema.optional(), // ⭐ AGGIUNTO
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    cedolare_secca: z.boolean().optional(),
    typology: z.enum(['residenziale', 'commerciale']).optional(),
    canone_concordato: z.boolean().optional(),
    monthly_rent: z.number().positive().optional(),
    last_annuity_paid: z.number().int().nullable().optional(),
    address: z.string().max(255, 'Indirizzo troppo lungo').optional(),
  })
  .refine(
    (data) => {
      // Se entrambe le date sono fornite, end_date deve essere successiva
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        return end > start;
      }
      return true;
    },
    {
      message: 'La data di fine deve essere successiva alla data di inizio',
      path: ['end_date'],
    }
  );

/**
 * ⭐ FASE 3.3: Schema validazione rinnovo contratto.
 * Tutti i campi obbligatori (nuove condizioni complete).
 * Validazione custom: end_date > start_date.
 * * NO tenant_id/owner_id: il rinnovo mantiene sempre gli stessi soggetti.
 */
const renewContractSchema = z
  .object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
    cedolare_secca: z.boolean({ error: 'Cedolare secca obbligatoria' }),
    typology: z.enum(['residenziale', 'commerciale'] as const, {
      error: 'Tipologia deve essere residenziale o commerciale',
    }),
    canone_concordato: z.boolean({ error: 'Canone concordato obbligatorio' }),
    monthly_rent: z.number().positive('Canone mensile deve essere positivo'),
  })
  .refine(
    (data) => {
      // Validazione custom: end_date > start_date
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end > start;
    },
    {
      message: 'La data di fine deve essere successiva alla data di inizio',
      path: ['end_date'],
    }
  );

/**
 * ⭐ FASE 3.4: Schema validazione aggiornamento annualità.
 * Accetta solo l'anno da marcare come pagato.
 */
const updateAnnuitySchema = z.object({
  last_annuity_paid: z.number().int().positive('Anno annualità non valido'),
});

/**
 * Schema validazione query params paginazione
 */
const paginationSchema = z.object({
  page: z.preprocess((v) => (v ? Number(v) : undefined), z.number().min(1).default(1)),
  limit: z.preprocess((v) => (v ? Number(v) : undefined), z.number().min(1).max(100).default(12)),
});

/**
 * Schema validazione query params filtri contratti
 */
const contractFiltersSchema = paginationSchema.extend({
  ownerId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()),
  search: z.string().optional(),
  expiryMonth: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().min(1).max(12).optional()),
  expiryYear: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().min(2020).optional()),
});

// ============= CONTROLLERS =============

/**
 * Controller per creare un nuovo contratto.
 * POST /api/contracts
 */
export const createContractController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] POST / - userId:', req.userId);

  try {
    // Validazione input con Zod
    const validatedData = createContractSchema.parse(req.body);
    console.log('[CONTRACT_CONTROLLER] Dati validati per creazione contratto');

    // Chiama service
    const contract = await contractService.createContract(req.userId, validatedData as CreateContractBody);

    res.status(201).json({
      success: true,
      data: contract,
      message: 'Contratto creato con successo',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[CONTRACT_CONTROLLER] Errore validazione:', err.issues);
      const errorMessage = err.issues.map(i => i.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next(err);
  }
};

/**
 * Controller per ottenere lista contratti con filtri e paginazione.
 * GET /api/contracts?page=1&limit=12&ownerId=5&search=mario&expiryMonth=10&expiryYear=2025
 */
export const getContractsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] GET / - userId:', req.userId);

  try {
    // Validazione query params
    const { page, limit, ownerId, search, expiryMonth, expiryYear } = 
      contractFiltersSchema.parse(req.query);

    console.log('[CONTRACT_CONTROLLER] Query params validati:', {
      page,
      limit,
      ownerId,
      search,
      expiryMonth,
      expiryYear,
    });

    // Chiama service
    const { data, total } = await contractService.getContracts(req.userId, page, limit, {
      ownerId,
      search,
      expiryMonth,
      expiryYear,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[CONTRACT_CONTROLLER] Errore validazione query:', err.issues);
      const errorMessage = err.issues.map(i => i.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next(err);
  }
};

/**
 * Controller per ottenere dettagli singolo contratto.
 * FASE 3: Include annuities nella response.
 * GET /api/contracts/:id
 */
export const getContractByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] GET /:id - userId:', req.userId, 'contractId:', req.params.id);

  try {
    const contractId = Number(req.params.id);

    // Validazione id
    if (isNaN(contractId) || contractId <= 0) {
      throw new AppError('ID contratto non valido', 400);
    }

    // Chiama service (ora include annuities)
    const contract = await contractService.getContractById(req.userId, contractId);

    res.json({
      success: true,
      data: contract,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * FASE 3: Controller per ottenere solo le annuities di un contratto.
 * GET /api/contracts/:id/annuities
 */
export const getContractAnnuitiesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] GET /:id/annuities - userId:', req.userId, 'contractId:', req.params.id);

  try {
    const contractId = Number(req.params.id);

    // Validazione id
    if (isNaN(contractId) || contractId <= 0) {
      throw new AppError('ID contratto non valido', 400);
    }

    // IMPORTANTE: Prima verifica che il contratto appartenga all'utente
    // getAnnuitiesByContract fa già questo controllo internamente
    const annuities = await annuityService.getAnnuitiesByContract(contractId);

    // Nota: getAnnuitiesByContract verifica ownership tramite contratto
    // Se l'utente non è autorizzato, lancerà un 404

    res.json({
      success: true,
      data: annuities,
      message: `Timeline annualità per contratto ${contractId}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller per aggiornare un contratto esistente.
 * ⭐ AGGIORNATO: Supporta anche update dati tenant tramite tenant_data
 * PUT /api/contracts/:id
 */
export const updateContractController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] PUT /:id - userId:', req.userId, 'contractId:', req.params.id);

  try {
    const contractId = Number(req.params.id);

    // Validazione id
    if (isNaN(contractId) || contractId <= 0) {
      throw new AppError('ID contratto non valido', 400);
    }

    // Validazione body (ora include tenant_data)
    const validatedData = updateContractSchema.parse(req.body);
    console.log('[CONTRACT_CONTROLLER] Dati validati per update contratto');
    
    if (validatedData.tenant_data) {
      console.log('[CONTRACT_CONTROLLER] Richiesto update dati tenant');
    }

    // Chiama service
    const updatedContract = await contractService.updateContract(
      req.userId,
      contractId,
      validatedData
    );

    res.json({
      success: true,
      data: updatedContract,
      message: 'Contratto aggiornato con successo',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[CONTRACT_CONTROLLER] Errore validazione:', err.issues);
      const errorMessage = err.issues.map(i => i.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next(err);
  }
};

/**
 * Controller per eliminare un contratto (CASCADE annuities).
 * DELETE /api/contracts/:id
 */
export const deleteContractController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] DELETE /:id - userId:', req.userId, 'contractId:', req.params.id);

  try {
    const contractId = Number(req.params.id);

    // Validazione id
    if (isNaN(contractId) || contractId <= 0) {
      throw new AppError('ID contratto non valido', 400);
    }

    // Chiama service
    await contractService.deleteContract(req.userId, contractId);

    res.json({
      success: true,
      message: 'Contratto eliminato con successo',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ⭐ FASE 3.3: Controller per rinnovare un contratto esistente.
 * PUT /api/contracts/:id/renew
 * * Validazione:
 * - Tutti i campi obbligatori (nuove condizioni complete)
 * - Date valide con end_date > start_date
 * - NO cambio owner/tenant (gestito automaticamente dal service)
 * * Response:
 * - Contratto aggiornato con dettagli owner, tenant
 * - Timeline annuities completa (se NON cedolare_secca)
 * * @example Body
 * {
 * "start_date": "2028-01-15",
 * "end_date": "2032-01-15",
 * "cedolare_secca": false,
 * "typology": "residenziale",
 * "canone_concordato": true,
 * "monthly_rent": 950.00
 * }
 */
export const renewContractController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] 🔄 PUT /:id/renew - userId:', req.userId, 'contractId:', req.params.id);

  try {
    const contractId = Number(req.params.id);

    // Validazione id
    if (isNaN(contractId) || contractId <= 0) {
      throw new AppError('ID contratto non valido', 400);
    }

    // Validazione body con schema rinnovo
    const validatedData = renewContractSchema.parse(req.body);
    console.log('[CONTRACT_CONTROLLER] ✅ Dati rinnovo validati:', {
      start_date: validatedData.start_date,
      end_date: validatedData.end_date,
      cedolare_secca: validatedData.cedolare_secca,
    });

    // Chiama service per rinnovo
    const renewedContract = await contractService.renewContract(
      req.userId,
      contractId,
      validatedData
    );

    res.json({
      success: true,
      data: renewedContract,
      message: 'Contratto rinnovato con successo',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[CONTRACT_CONTROLLER] ❌ Errore validazione rinnovo:', err.issues);
      const errorMessage = err.issues.map(i => i.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next(err);
  }
};

/**
 * ⭐ FASE 3.4: Controller per aggiornare annualità successiva.
 * PUT /api/contracts/:id/annuity
 *
 * Validazione:
 * - Body { last_annuity_paid: <anno> }
 *
 * Logica (delegata a annuity.service):
 * - Aggiorna contract.last_annuity_paid = <anno>
 * - Aggiorna annuity(contract_id, <anno>) -> is_paid = true, paid_at = NOW
 */
export const updateContractAnnuityController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[CONTRACT_CONTROLLER] 💹 PUT /:id/annuity - userId:', req.userId, 'contractId:', req.params.id);

  try {
    const contractId = Number(req.params.id);

    // 1. Validazione ID
    if (isNaN(contractId) || contractId <= 0) {
      throw new AppError('ID contratto non valido', 400);
    }

    // 2. Validazione Body
    const validatedData = updateAnnuitySchema.parse(req.body) as RenewAnnuityBody;
    const { last_annuity_paid } = validatedData;
    console.log(`[CONTRACT_CONTROLLER] ✅ Dati validati: pagata annualità ${last_annuity_paid}`);

    // 3. Chiama service
    // Il service gestisce la doppia logica e la verifica di ownership
    const updatedContract = await annuityService.updateAnnuityPaid(
      contractId,
      last_annuity_paid
    );

    res.json({
      success: true,
      data: updatedContract, // Restituisce il contratto aggiornato (con annuities)
      message: `Annualità ${last_annuity_paid} pagata con successo`,
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[CONTRACT_CONTROLLER] ❌ Errore validazione annualità:', err.issues);
      const errorMessage = err.issues.map(i => i.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next(err);
  }
};
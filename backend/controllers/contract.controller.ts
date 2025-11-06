import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as contractService from '../services/contract.service';
import { CreateContractBody } from '../types/api';
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
 */
const updateContractSchema = z
  .object({
    owner_id: z.number().int().positive().optional(),
    tenant_id: z.number().int().positive().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    cedolare_secca: z.boolean().optional(),
    typology: z.enum(['residenziale', 'commerciale']).optional(),
    canone_concordato: z.boolean().optional(),
    monthly_rent: z.number().positive().optional(),
    last_annuity_paid: z.number().int().nullable().optional(),
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
 * Schema validazione query params paginazione
 */
const paginationSchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().min(1).default(1)),
  limit: z.preprocess((v) => Number(v), z.number().min(1).max(100).default(12)),
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
      return next(new AppError('Dati di input non validi', 400));
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
      return next(new AppError('Parametri non validi', 400));
    }
    next(err);
  }
};

/**
 * Controller per ottenere dettagli singolo contratto.
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

    // Chiama service
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
 * Controller per aggiornare un contratto esistente.
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

    // Validazione body
    const validatedData = updateContractSchema.parse(req.body);
    console.log('[CONTRACT_CONTROLLER] Dati validati per update contratto');

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
      return next(new AppError('Dati di input non validi', 400));
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
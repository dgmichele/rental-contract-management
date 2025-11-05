import { Response, NextFunction } from 'express';
import * as ownerService from '../services/owner.service';
import { z } from 'zod';
import { NewOwner } from '../types/database';
import { AuthenticatedRequest } from '../types/express';
import AppError from '../utils/AppError';

// ============= ZOD SCHEMAS =============

/**
 * Schema validazione creazione proprietario
 */
const createOwnerSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').toLowerCase().trim(),
});

/**
 * Schema validazione aggiornamento proprietario
 */
const updateOwnerSchema = z.object({
  name: z.string().min(1).trim().optional(),
  surname: z.string().min(1).trim().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').toLowerCase().trim().optional(),
});

/**
 * Schema validazione paginazione e ricerca
 */
const paginationSchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().min(1).default(1)),
  limit: z.preprocess((v) => Number(v), z.number().min(1).max(100).default(12)),
  search: z.string().optional(),
});

// ============= CONTROLLERS =============

/**
 * Controller per creare un nuovo proprietario.
 * POST /api/owner
 */
export const createOwnerController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[OWNER_CONTROLLER] POST / - userId:', req.userId);

  try {
    // Validazione input
    const validatedData = createOwnerSchema.parse(req.body);
    console.log('[OWNER_CONTROLLER] Dati validati per creazione owner');

    // Chiama service
    const owner = await ownerService.createOwner(req.userId, validatedData as NewOwner);

    res.status(201).json({
      success: true,
      data: owner,
      message: 'Proprietario creato con successo',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[OWNER_CONTROLLER] Errore validazione:', err.issues);
      return next(new AppError('Dati di input non validi', 400));
    }
    next(err);
  }
};

/**
 * Controller per ottenere lista proprietari con paginazione e ricerca.
 * GET /api/owner?page=1&limit=12&search=mario
 */
export const getOwnersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[OWNER_CONTROLLER] GET / - userId:', req.userId);

  try {
    // Validazione query params
    const { page, limit, search } = paginationSchema.parse(req.query);
    console.log('[OWNER_CONTROLLER] Query params validati:', { page, limit, search });

    // Chiama service
    const { data, total } = await ownerService.getOwners(req.userId, page, limit, search);

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
      console.log('[OWNER_CONTROLLER] Errore validazione query:', err.issues);
      return next(new AppError('Parametri non validi', 400));
    }
    next(err);
  }
};

/**
 * Controller per ottenere dettagli singolo proprietario.
 * GET /api/owner/:id
 */
export const getOwnerByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[OWNER_CONTROLLER] GET /:id - userId:', req.userId, 'ownerId:', req.params.id);

  try {
    const ownerId = Number(req.params.id);

    // Validazione id
    if (isNaN(ownerId) || ownerId <= 0) {
      throw new AppError('ID proprietario non valido', 400);
    }

    // Chiama service
    const owner = await ownerService.getOwnerById(req.userId, ownerId);

    res.json({
      success: true,
      data: owner,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller per aggiornare un proprietario.
 * PUT /api/owner/:id
 */
export const updateOwnerController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[OWNER_CONTROLLER] PUT /:id - userId:', req.userId, 'ownerId:', req.params.id);

  try {
    const ownerId = Number(req.params.id);

    // Validazione id
    if (isNaN(ownerId) || ownerId <= 0) {
      throw new AppError('ID proprietario non valido', 400);
    }

    // Validazione body
    const validatedData = updateOwnerSchema.parse(req.body);
    console.log('[OWNER_CONTROLLER] Dati validati per update owner');

    // Chiama service
    const updatedOwner = await ownerService.updateOwner(req.userId, ownerId, validatedData);

    res.json({
      success: true,
      data: updatedOwner,
      message: 'Proprietario aggiornato con successo',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('[OWNER_CONTROLLER] Errore validazione:', err.issues);
      return next(new AppError('Dati di input non validi', 400));
    }
    next(err);
  }
};

/**
 * Controller per eliminare un proprietario (CASCADE contratti).
 * DELETE /api/owner/:id
 */
export const deleteOwnerController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[OWNER_CONTROLLER] DELETE /:id - userId:', req.userId, 'ownerId:', req.params.id);

  try {
    const ownerId = Number(req.params.id);

    // Validazione id
    if (isNaN(ownerId) || ownerId <= 0) {
      throw new AppError('ID proprietario non valido', 400);
    }

    // Chiama service
    await ownerService.deleteOwner(req.userId, ownerId);

    res.json({
      success: true,
      message: 'Proprietario eliminato con successo',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller per ottenere contratti di un proprietario con paginazione.
 * GET /api/owner/:id/contracts?page=1&limit=12
 */
export const getOwnerContractsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[OWNER_CONTROLLER] GET /:id/contracts - userId:', req.userId, 'ownerId:', req.params.id);

  try {
    const ownerId = Number(req.params.id);

    // Validazione id
    if (isNaN(ownerId) || ownerId <= 0) {
      throw new AppError('ID proprietario non valido', 400);
    }

    // Validazione query params
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    if (page <= 0 || limit <= 0 || limit > 100) {
      throw new AppError('Parametri paginazione non validi', 400);
    }

    // Chiama service
    const { data, total } = await ownerService.getOwnerContracts(req.userId, ownerId, page, limit);

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
    next(err);
  }
};
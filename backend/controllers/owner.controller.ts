import { Response, NextFunction } from 'express';
import * as ownerService from '../services/owner.service';
import { z } from 'zod';
import { NewOwner } from '../types/database';
import { AuthenticatedRequest } from '../types/express';

// Zod Schemas
const createOwnerSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
});

const updateOwnerSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const paginationSchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().min(1).default(1)),
  limit: z.preprocess((v) => Number(v), z.number().min(1).default(12)),
  search: z.string().optional(),
});

// Controllers
export const createOwnerController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createOwnerSchema.parse(req.body);
    const owner = await ownerService.createOwner(req.userId, parsed as NewOwner);
    res.status(201).json({ success: true, data: owner, message: 'Owner creato con successo' });
  } catch (err) {
    next(err);
  }
};

export const getOwnersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = paginationSchema.parse(req.query);
    const { data, total } = await ownerService.getOwners(req.userId, parsed.page, parsed.limit, parsed.search);
    res.json({
      success: true,
      data,
      pagination: {
        page: parsed.page,
        limit: parsed.limit,
        total,
        totalPages: Math.ceil(total / parsed.limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getOwnerByIdController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const owner_id = Number(req.params.id);
    const owner = await ownerService.getOwnerById(req.userId, owner_id);
    res.json({ success: true, data: owner });
  } catch (err) {
    next(err);
  }
};

export const updateOwnerController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const owner_id = Number(req.params.id);
    const parsed = updateOwnerSchema.parse(req.body);
    const updated = await ownerService.updateOwner(req.userId, owner_id, parsed);
    res.json({ success: true, data: updated, message: 'Owner aggiornato con successo' });
  } catch (err) {
    next(err);
  }
};

export const deleteOwnerController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const owner_id = Number(req.params.id);
    await ownerService.deleteOwner(req.userId, owner_id);
    res.json({ success: true, message: 'Owner eliminato con successo' });
  } catch (err) {
    next(err);
  }
};

export const getOwnerContractsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const owner_id = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const { data, total } = await ownerService.getOwnerContracts(req.userId, owner_id, page, limit);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};
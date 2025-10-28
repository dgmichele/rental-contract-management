import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { z } from 'zod';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const updateDetailsSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  surname: z.string().min(1, 'Il cognome è obbligatorio'),
  email: z.string().email('Email non valida'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Password attuale non valida'),
  newPassword: z.string().min(6, 'La nuova password deve contenere almeno 6 caratteri'),
});

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Utente non autenticato', 401);

    const user = await userService.getUserById(userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Utente non autenticato', 401);

    const data = updateDetailsSchema.parse(req.body);
    const updatedUser = await userService.updateUserDetails(userId, data);

    res.status(200).json({
      success: true,
      message: 'Dati aggiornati con successo',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Utente non autenticato', 401);

    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
    await userService.updateUserPassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password aggiornata con successo',
    });
  } catch (err) {
    next(err);
  }
};

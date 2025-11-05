import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { z } from 'zod';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types/express';

/**
 * Schema validazione per aggiornamento dati utente
 */
const updateDetailsSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  email: z.string().email('Email non valida').toLowerCase().trim(),
});

/**
 * Schema validazione per aggiornamento password
 */
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale obbligatoria'),
  newPassword: z
    .string()
    .min(8, 'La nuova password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
});

/**
 * Controller per ottenere i dati dell'utente autenticato.
 * GET /api/user/me
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[USER_CONTROLLER] GET /me - userId:', req.userId);

  try {
    const user = await userService.getUserById(req.userId);
    
    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller per aggiornare i dati dell'utente (nome, cognome, email).
 * PUT /api/user/me/details
 */
export const updateDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[USER_CONTROLLER] PUT /me/details - userId:', req.userId);

  try {
    // Validazione input
    const validatedData = updateDetailsSchema.parse(req.body);
    console.log('[USER_CONTROLLER] Dati validati per update');

    // Chiama service
    const updatedUser = await userService.updateUserDetails(req.userId, validatedData);

    res.status(200).json({
      success: true,
      message: 'Dati aggiornati con successo',
      data: updatedUser,
    });
  } catch (err) {
    // Gestione errori Zod
    if (err instanceof z.ZodError) {
      console.log('[USER_CONTROLLER] Errore validazione:', err.issues);
      return next(new AppError('Dati di input non validi', 400));
    }
    
    next(err);
  }
};

/**
 * Controller per aggiornare la password dell'utente.
 * PUT /api/user/me/password
 */
export const updatePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[USER_CONTROLLER] PUT /me/password - userId:', req.userId);

  try {
    // Validazione input
    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
    console.log('[USER_CONTROLLER] Password validata per update');

    // Chiama service
    await userService.updateUserPassword(req.userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password aggiornata con successo',
    });
  } catch (err) {
    // Gestione errori Zod
    if (err instanceof z.ZodError) {
      console.log('[USER_CONTROLLER] Errore validazione:', err.issues);
      return next(new AppError('Dati di input non validi', 400));
    }
    
    next(err);
  }
};
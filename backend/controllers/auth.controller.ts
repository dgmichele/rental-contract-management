import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.services';
import * as emailService from '../services/email.services';
import AppError from '../utils/AppError';

// ============= ZOD SCHEMAS =============

/**
 * Schema di validazione per registrazione utente.
 * Password: minimo 8 caratteri, almeno 1 maiuscola, 1 minuscola, 1 numero
 */
const registerSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').trim(),
  surname: z.string().min(1, 'Il cognome è obbligatorio').trim(),
  email: z.string().email('Email non valida').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
});

/**
 * Schema di validazione per login.
 */
const loginSchema = z.object({
  email: z.string().email('Email non valida').toLowerCase().trim(),
  password: z.string().min(1, 'La password è obbligatoria'),
});

/**
 * Schema di validazione per refresh token.
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token mancante'),
});

// ============= CONTROLLERS =============

/**
 * Controller per registrazione nuovo utente.
 * POST /api/auth/register
 */
export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[AUTH_CONTROLLER] POST /register - Inizio validazione');

  try {
    // Validazione input con Zod
    const validatedData = registerSchema.parse(req.body);
    console.log('[AUTH_CONTROLLER] Validazione completata per:', validatedData.email);

    // Chiama il service
    const result = await authService.register(validatedData);

    console.log('[AUTH_CONTROLLER] Registrazione completata, userId:', result.user.id);

    // Response 201 Created
    res.status(201).json({
      success: true,
      data: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: result.user,
      },
      message: 'Registrazione completata con successo',
    });
  } catch (error) {
    // Gestione errori Zod (validazione)
    if (error instanceof z.ZodError) {
      console.log('[AUTH_CONTROLLER] Errore validazione:', error.issues);

      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return next(new AppError('Dati di input non validi', 400));
    }

    // Passa altri errori al middleware errorHandler
    next(error);
  }
};

/**
 * Controller per login utente esistente.
 * POST /api/auth/login
 */
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[AUTH_CONTROLLER] POST /login - Inizio validazione');

  try {
    // Validazione input
    const validatedData = loginSchema.parse(req.body);
    console.log('[AUTH_CONTROLLER] Validazione completata per:', validatedData.email);

    // Chiama il service
    const result = await authService.login(validatedData);

    console.log('[AUTH_CONTROLLER] Login completato, userId:', result.user.id);

    // Response 200 OK
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: result.user,
      },
      message: 'Login effettuato con successo',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[AUTH_CONTROLLER] Errore validazione:', error.issues);
      return next(new AppError('Dati di input non validi', 400));
    }

    next(error);
  }
};

/**
 * Controller per rinnovo access token.
 * POST /api/auth/refresh
 */
export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[AUTH_CONTROLLER] POST /refresh - Richiesta rinnovo token');

  try {
    // Validazione input
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    console.log('[AUTH_CONTROLLER] Refresh token ricevuto');

    // Chiama il service
    const newAccessToken = await authService.refreshAccessToken(refreshToken);

    console.log('[AUTH_CONTROLLER] Nuovo access token generato');

    // Response 200 OK
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
      message: 'Token rinnovato con successo',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[AUTH_CONTROLLER] Errore validazione:', error.issues);
      return next(new AppError('Refresh token mancante', 400));
    }

    next(error);
  }
};

/**
 * Controller per logout utente.
 * POST /api/auth/logout
 */
export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[AUTH_CONTROLLER] POST /logout - Richiesta logout');

  try {
    // Validazione input
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    console.log('[AUTH_CONTROLLER] Refresh token ricevuto per logout');

    // Chiama il service
    await authService.logout(refreshToken);

    console.log('[AUTH_CONTROLLER] Logout completato');

    // Response 200 OK
    res.status(200).json({
      success: true,
      message: 'Logout effettuato con successo',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[AUTH_CONTROLLER] Errore validazione:', error.issues);
      return next(new AppError('Refresh token mancante', 400));
    }

    next(error);
  }
};

// Schemi Zod per password reset
const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida').toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token mancante'),
  newPassword: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
});

// POST /forgot-password
export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Genera token di reset
    const token = await authService.requestPasswordReset(email);

    // Invia email
    await emailService.sendPasswordResetEmail(email, token);

    res.status(200).json({
      success: true,
      message: `Email per il reset della password inviata se l'utente esiste`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Email non valida', 400));
    }
    next(error);
  }
};

// POST /reset-password
export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Reset password
    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password resettata con successo',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Token o password non validi', 400));
    }
    next(error);
  }
};

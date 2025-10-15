
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  LogoutRequestSchema,
} from '../types/auth';

/**
 * @description Gestisce la registrazione di un nuovo utente.
 * @route POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = RegisterRequestSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.register(
      validatedData
    );

    // Imposta il refresh token in un cookie HttpOnly per maggior sicurezza
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni
    });

    res.status(201).json({ success: true, data: { accessToken, user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Gestisce il login dell'utente.
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = LoginRequestSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(
      validatedData
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni
    });

    res.status(200).json({ success: true, data: { accessToken, user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Gestisce il refresh dell'access token.
 * @route POST /api/auth/refresh
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Il refresh token viene prelevato dai cookie
    const { refreshToken } = req.cookies;
    const validatedData = RefreshRequestSchema.parse({ refreshToken });

    const { accessToken } = await authService.refreshAccessToken(
      validatedData.refreshToken
    );
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Gestisce il logout dell'utente.
 * @route POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Il refresh token viene passato nel body per invalidarlo
    const { refreshToken } = req.body;
    const validatedData = LogoutRequestSchema.parse({ refreshToken });

    await authService.logout(validatedData.refreshToken);

    // Pulisce il cookie del refresh token
    res.clearCookie('refreshToken');

    res.status(200).json({ success: true, message: 'Logout effettuato con successo.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Gestisce la richiesta di reset password.
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = ForgotPasswordRequestSchema.parse(req.body);
    await authService.requestPasswordReset(validatedData.email);
    res.status(200).json({
      success: true,
      message: 'Se l\'utente esiste, riceverà un\'email con le istruzioni per il reset della password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Gestisce il reset della password con un token.
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = ResetPasswordRequestSchema.parse(req.body);
    await authService.resetPassword(validatedData.token, validatedData.newPassword);
    res.status(200).json({ success: true, message: 'Password aggiornata con successo.' });
  } catch (error) {
    next(error);
  }
};

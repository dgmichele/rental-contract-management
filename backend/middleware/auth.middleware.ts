import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.utils';
import { JwtPayload } from '../types/auth';
import db from '../config/db';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types/express';

/**
 * Middleware di autenticazione JWT.
 * Verifica la presenza e validità dell'access token nell'header Authorization.
 * Controlla che il token non sia in blacklist.
 * Aggiunge userId e userEmail a req per uso nei controller.
 * 
 * @throws AppError 401 se token mancante, invalido, scaduto o blacklisted
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('[AUTH_MIDDLEWARE] Verifica autenticazione per:', req.method, req.path);

  try {
    // 1. Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH_MIDDLEWARE] Header Authorization mancante o malformato');
      throw new AppError('Token di autenticazione mancante', 401);
    }

    const token = authHeader.substring(7); // Rimuove "Bearer "
    console.log('[AUTH_MIDDLEWARE] Token estratto dall\'header');

    // 2. Verifica e decodifica il token
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token, 'access');
      console.log('[AUTH_MIDDLEWARE] Token decodificato, userId:', decoded.userId);
    } catch (error) {
      console.log('[AUTH_MIDDLEWARE] Errore verifica token:', error instanceof Error ? error.message : 'unknown');
      throw new AppError('Token di autenticazione non valido o scaduto', 401);
    }

    // 3. Verifica che il token non sia in blacklist
    // Nota: Tecnicamente gli access token non vengono blacklistati (solo i refresh),
    // ma questo check aggiunge un layer di sicurezza se in futuro si decidesse di farlo
    const isBlacklisted = await db('blacklisted_tokens')
      .where({ token })
      .first();

    if (isBlacklisted) {
      console.log('[AUTH_MIDDLEWARE] Token blacklisted');
      throw new AppError('Token di autenticazione non valido', 401);
    }

    // 4. Verifica che l'utente esista ancora nel DB
    // (potrebbe essere stato eliminato dopo emissione del token)
    const userExists = await db('users')
      .where({ id: decoded.userId })
      .first();

    if (!userExists) {
      console.log('[AUTH_MIDDLEWARE] Utente non più esistente, userId:', decoded.userId);
      throw new AppError('Utente non autorizzato', 401);
    }

    // 5. Attach dei dati utente alla request (STANDARDIZZATO)
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    console.log('[AUTH_MIDDLEWARE] Autenticazione completata, userId:', req.userId);

    // 6. Passa al prossimo middleware/controller
    next();
  } catch (error) {
    // Se è già un AppError, passa al errorHandler
    if (error instanceof AppError) {
      return next(error);
    }

    // Per errori generici
    console.error('[AUTH_MIDDLEWARE] Errore imprevisto:', error);
    next(new AppError('Errore durante la verifica dell\'autenticazione', 500));
  }
};
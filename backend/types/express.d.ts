import { Request } from 'express';

/**
 * Estende il tipo Request di Express per supportare dati utente autenticato.
 * Questi campi sono opzionali sul tipo base perché non tutte le route richiedono auth.
 */
declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    userEmail?: string;
  }
}

/**
 * Tipo custom per controller che richiedono autenticazione.
 * Garantisce che userId e userEmail siano SEMPRE presenti dopo authMiddleware.
 */
export interface AuthenticatedRequest extends Request {
  userId: number;
  userEmail: string;
}

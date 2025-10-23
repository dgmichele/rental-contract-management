import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import AppError from '../utils/AppError';

/**
 * Middleware centrale per la gestione degli errori.
 * Cattura tutti gli errori lanciati dai controller/middleware e restituisce
 * una risposta JSON consistente al client.
 * 
 * Gestisce:
 * - AppError (errori operazionali custom)
 * - ZodError (errori di validazione)
 * - JsonWebTokenError (errori JWT)
 * - Errori generici
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[ERROR_HANDLER] Errore catturato:');
  console.error('[ERROR_HANDLER] Tipo:', err.constructor.name);
  console.error('[ERROR_HANDLER] Messaggio:', err.message);
  console.error('[ERROR_HANDLER] Path:', req.method, req.path);

  // ============= 1. ERRORI OPERAZIONALI (AppError) =============
  if (err instanceof AppError && err.isOperational) {
    console.log('[ERROR_HANDLER] AppError operazionale, statusCode:', err.statusCode);
    
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    }) as any;
  }

  // ============= 2. ERRORI DI VALIDAZIONE (Zod) =============
  if (err instanceof ZodError) {
    console.log('[ERROR_HANDLER] Errore validazione Zod');
    
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Errore di validazione',
      errors: formattedErrors,
    }) as any;
  }

  // ============= 3. ERRORI JWT =============
  if (err instanceof TokenExpiredError) {
    console.log('[ERROR_HANDLER] Token JWT scaduto');
    
    return res.status(401).json({
      success: false,
      message: 'Token di autenticazione scaduto',
    }) as any;
  }

  if (err instanceof JsonWebTokenError) {
    console.log('[ERROR_HANDLER] Token JWT non valido');
    
    return res.status(401).json({
      success: false,
      message: 'Token di autenticazione non valido',
    }) as any;
  }

  // ============= 4. ERRORI DATABASE (Knex/PostgreSQL) =============
  // Errori comuni di Knex/PostgreSQL
  if (err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
    console.log('[ERROR_HANDLER] Errore unique constraint DB');
    
    return res.status(409).json({
      success: false,
      message: 'Risorsa già esistente',
    }) as any;
  }

  if (err.message.includes('foreign key constraint')) {
    console.log('[ERROR_HANDLER] Errore foreign key constraint DB');
    
    return res.status(400).json({
      success: false,
      message: 'Riferimento a risorsa inesistente',
    }) as any;
  }

  if (err.message.includes('violates not-null constraint')) {
    console.log('[ERROR_HANDLER] Errore not-null constraint DB');
    
    return res.status(400).json({
      success: false,
      message: 'Campi obbligatori mancanti',
    }) as any;
  }

  // ============= 5. ERRORE GENERICO (500) =============
  console.error('[ERROR_HANDLER] ❌ ERRORE NON GESTITO:');
  console.error('[ERROR_HANDLER] Stack trace:', err.stack);

  // In produzione, NON esporre dettagli interni
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    message: isProduction 
      ? 'Errore del server, riprova più tardi' 
      : err.message,
    ...(isProduction ? {} : { stack: err.stack }), // Stack solo in dev
  });
};
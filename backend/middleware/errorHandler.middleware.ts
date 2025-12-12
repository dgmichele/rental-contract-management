import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import AppError from '../utils/AppError';
import { logError, logWarn, logInfo } from '../services/logger.service';

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
  // Log iniziale dell'errore con contesto
  logError(`[ERROR_HANDLER] Errore catturato - Tipo: ${err.constructor.name}, Path: ${req.method} ${req.path}`, {
    type: err.constructor.name,
    message: err.message,
    method: req.method,
    path: req.path,
  });

  // ============= 1. ERRORI OPERAZIONALI (AppError) =============
  if (err instanceof AppError && err.isOperational) {
    // Log come warning per errori operazionali (4xx) o error per errori server (5xx)
    if (err.statusCode >= 500) {
      logError(`[ERROR_HANDLER] AppError operazionale (${err.statusCode}): ${err.message}`);
    } else {
      logWarn(`[ERROR_HANDLER] AppError operazionale (${err.statusCode}): ${err.message}`);
    }
    
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    }) as any;
  }

  // ============= 2. ERRORI DI VALIDAZIONE (Zod) =============
  if (err instanceof ZodError) {
    logWarn('[ERROR_HANDLER] Errore validazione Zod', { issues: err.issues });
    
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
    logWarn('[ERROR_HANDLER] Token JWT scaduto');
    
    return res.status(401).json({
      success: false,
      message: 'Token di autenticazione scaduto',
    }) as any;
  }

  if (err instanceof JsonWebTokenError) {
    logWarn('[ERROR_HANDLER] Token JWT non valido');
    
    return res.status(401).json({
      success: false,
      message: 'Token di autenticazione non valido',
    }) as any;
  }

  // ============= 4. ERRORI DATABASE (Knex/PostgreSQL) =============
  // Errori comuni di Knex/PostgreSQL
  if (err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
    logWarn('[ERROR_HANDLER] Errore unique constraint DB: ' + err.message);
    
    return res.status(409).json({
      success: false,
      message: 'Risorsa già esistente',
    }) as any;
  }

  if (err.message.includes('foreign key constraint')) {
    logWarn('[ERROR_HANDLER] Errore foreign key constraint DB: ' + err.message);
    
    return res.status(400).json({
      success: false,
      message: 'Riferimento a risorsa inesistente',
    }) as any;
  }

  if (err.message.includes('violates not-null constraint')) {
    logWarn('[ERROR_HANDLER] Errore not-null constraint DB: ' + err.message);
    
    return res.status(400).json({
      success: false,
      message: 'Campi obbligatori mancanti',
    }) as any;
  }

  // ============= 5. ERRORE GENERICO (500) =============
  // Log critico con stack trace completo
  logError('[ERROR_HANDLER] ❌ ERRORE NON GESTITO', {
    message: err.message,
    stack: err.stack,
    type: err.constructor.name,
  });

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
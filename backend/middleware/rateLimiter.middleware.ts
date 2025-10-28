import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Funzione helper per creare limiter con risposta JSON standard
 * @param max numero massimo di richieste
 * @param windowMs finestra temporale in ms
 * @param message messaggio JSON in caso di superamento limite
 */
const createLimiter = (max: number, windowMs: number, message: string): RateLimitRequestHandler => {
  // Se siamo in ambiente di test, non applichiamo il rate limiting
  if (process.env.NODE_ENV === 'test') {
    const noop: RateLimitRequestHandler = ((req: Request, res: Response, next: NextFunction) => next()) as RateLimitRequestHandler;
    // assegniamo le proprietà richieste dal tipo RateLimitRequestHandler
    (noop as any).resetKey = (key: string) => {};
    (noop as any).getKey = (key: string) => undefined;
    return noop;
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // X-RateLimit-* headers
    legacyHeaders: false,  // disabilita vecchi headers
    handler: (req: Request, res: Response, next: NextFunction) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
  });
};

/**
 * Limiter per login: 5 richieste ogni 15 minuti
 */
export const loginLimiter: RateLimitRequestHandler = createLimiter(
  5,
  15 * 60 * 1000,
  "Hai superato il numero massimo di tentativi di login. Riprova tra 15 minuti."
);

/**
 * Limiter per register: 5 richieste ogni 15 minuti
 */
export const registerLimiter: RateLimitRequestHandler = createLimiter(
  5,
  15 * 60 * 1000,
  "Hai superato il numero massimo di registrazioni. Riprova tra 15 minuti."
);

/**
 * Limiter per forgot password: 3 richieste ogni 1 ora
 */
export const forgotPasswordLimiter: RateLimitRequestHandler = createLimiter(
  3,
  60 * 60 * 1000,
  "Hai superato il numero massimo di richieste per il reset password. Riprova tra 1 ora."
);
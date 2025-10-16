import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtPayload } from '../types/auth';

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRATION = '900s'; // 15 minuti
const REFRESH_TOKEN_EXPIRATION = '2592000s'; // 30 giorni

// Verifica che i secret siano definiti all'avvio
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET e REFRESH_TOKEN_SECRET devono essere definiti nelle variabili d\'ambiente');
}

/**
 * Genera un access token JWT.
 * @param userId - ID dell'utente
 * @param email - Email dell'utente
 * @returns Access token firmato
 */
export const generateAccessToken = (userId: number, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
};

/**
 * Genera un refresh token JWT.
 * @param userId - ID dell'utente
 * @param email - Email dell'utente
 * @returns Refresh token firmato
 */
export const generateRefreshToken = (userId: number, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });
};

/**
 * Verifica e decodifica un token (access o refresh).
 * @param token - Token JWT da verificare
 * @param type - Tipo di token ('access' | 'refresh')
 * @returns Payload decodificato con userId e email
 * @throws Error se il token non è valido o è scaduto
 */
export const verifyToken = (token: string, type: 'access' | 'refresh'): JwtPayload => {
  try {
    const secret = type === 'access' ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token scaduto');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token non valido');
    }
    throw new Error('Errore nella verifica del token');
  }
};
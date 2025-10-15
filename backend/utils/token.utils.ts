import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET!;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET!;

// Converte i tempi di scadenza in secondi per adattarsi a typescript
const accessTokenExpirationInSeconds = 900; // 15 minuti
const refreshTokenExpirationInSeconds = 2592000; // 30 giorni

if (!accessTokenSecret || !refreshTokenSecret) {
  throw new Error('I segreti dei token non sono definiti nelle variabili d\'ambiente');
}

/**
 * Genera un token di accesso.
 * @param userId - L'ID dell'utente.
 * @returns Il token di accesso generato.
 */
export const generateAccessToken = (userId: number): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: accessTokenExpirationInSeconds,
  };
  return jwt.sign({ id: userId }, accessTokenSecret, options);
};

/**
 * Genera un token di aggiornamento.
 * @param userId - L'ID dell'utente.
 * @returns Il token di aggiornamento generato.
 */
export const generateRefreshToken = (userId: number): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: refreshTokenExpirationInSeconds,
  };
  return jwt.sign({ id: userId }, refreshTokenSecret, options);
};

/**
 * Verifica un token di accesso.
 * @param token - Il token di accesso da verificare.
 * @returns Il payload del token decodificato.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, accessTokenSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Token di accesso non valido');
  }
};

/**
 * Verifica un token di aggiornamento.
 * @param token - Il token di aggiornamento da verificare.
 * @returns Il payload del token decodificato.
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, refreshTokenSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Token di aggiornamento non valido');
  }
};
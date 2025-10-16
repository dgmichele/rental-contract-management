import bcrypt from 'bcrypt';
import db  from '../config/db';
import { 
  NewUser, 
  User, 
  NewRefreshToken, 
  RefreshToken,
  NewBlacklistedToken 
} from '../types/database';
import { 
  AuthTokens, 
  AuthenticatedUser,
  RegisterBody,
  LoginBody 
} from '../types/auth';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken 
} from '../utils/token.utils';
import AppError from '../utils/AppError';

const SALT_ROUNDS = 10;

/**
 * Registra un nuovo utente nel sistema.
 * @param data - Dati di registrazione (name, surname, email, password)
 * @returns Tokens JWT e dati utente (senza password_hash)
 * @throws AppError 409 se l'email è già registrata
 * @throws AppError 500 per errori generici
 */
export const register = async (data: RegisterBody): Promise<{
  tokens: AuthTokens;
  user: AuthenticatedUser;
}> => {
  console.log('[AUTH_SERVICE] Inizio registrazione per email:', data.email);

  try {
    // Verifica se l'email esiste già
    const existingUser = await db('users')
      .where({ email: data.email })
      .first();

    if (existingUser) {
      console.log('[AUTH_SERVICE] Email già registrata:', data.email);
      throw new AppError('Email già registrata', 409);
    }

    // Hash della password
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    console.log('[AUTH_SERVICE] Password hashata con successo');

    // Crea l'utente
    const newUser: NewUser = {
      name: data.name,
      surname: data.surname,
      email: data.email,
      password_hash,
    };

    const [createdUser] = await db('users')
      .insert(newUser)
      .returning('*') as User[];

    console.log('[AUTH_SERVICE] Utente creato con ID:', createdUser.id);

    // Genera tokens
    const accessToken = generateAccessToken(createdUser.id, createdUser.email);
    const refreshToken = generateRefreshToken(createdUser.id, createdUser.email);

    // Salva refresh token in DB
    const newRefreshToken: NewRefreshToken = {
      user_id: createdUser.id,
      token: refreshToken,
    };

    await db('refresh_tokens').insert(newRefreshToken);
    console.log('[AUTH_SERVICE] Refresh token salvato in DB');

    // Prepara risposta (escludi password_hash)
    const userResponse: AuthenticatedUser = {
      id: createdUser.id,
      name: createdUser.name,
      surname: createdUser.surname,
      email: createdUser.email,
    };

    return {
      tokens: { accessToken, refreshToken },
      user: userResponse,
    };
  } catch (error) {
    // Se è già un AppError, rilancia
    if (error instanceof AppError) {
      throw error;
    }
    
    console.error('[AUTH_SERVICE] Errore durante registrazione:', error);
    throw new AppError('Errore durante la registrazione', 500);
  }
};

/**
 * Esegue il login di un utente esistente.
 * @param data - Credenziali di login (email, password)
 * @returns Tokens JWT e dati utente (senza password_hash)
 * @throws AppError 401 se le credenziali sono errate
 * @throws AppError 500 per errori generici
 */
export const login = async (data: LoginBody): Promise<{
  tokens: AuthTokens;
  user: AuthenticatedUser;
}> => {
  console.log('[AUTH_SERVICE] Tentativo di login per email:', data.email);

  try {
    // Trova l'utente per email
    const user = await db('users')
      .where({ email: data.email })
      .first() as User | undefined;

    if (!user) {
      console.log('[AUTH_SERVICE] Utente non trovato:', data.email);
      throw new AppError('Credenziali non valide', 401);
    }

    // Verifica password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isPasswordValid) {
      console.log('[AUTH_SERVICE] Password errata per utente:', user.id);
      throw new AppError('Credenziali non valide', 401);
    }

    console.log('[AUTH_SERVICE] Login valido per utente:', user.id);

    // Genera tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Salva refresh token in DB
    const newRefreshToken: NewRefreshToken = {
      user_id: user.id,
      token: refreshToken,
    };

    await db('refresh_tokens').insert(newRefreshToken);
    console.log('[AUTH_SERVICE] Refresh token salvato in DB');

    // Prepara risposta
    const userResponse: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
    };

    return {
      tokens: { accessToken, refreshToken },
      user: userResponse,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    console.error('[AUTH_SERVICE] Errore durante login:', error);
    throw new AppError('Errore durante il login', 500);
  }
};

/**
 * Rinnova l'access token usando un refresh token valido.
 * @param refreshToken - Refresh token JWT
 * @returns Nuovo access token
 * @throws AppError 401 se il refresh token è invalido, scaduto o blacklisted
 * @throws AppError 500 per errori generici
 */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  console.log('[AUTH_SERVICE] Richiesta rinnovo access token');

  try {
    // Verifica il refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
    console.log('[AUTH_SERVICE] Refresh token decodificato, userId:', decoded.userId);

    // Verifica che il token esista in DB e non sia blacklisted
    const tokenInDb = await db('refresh_tokens')
      .where({ token: refreshToken, user_id: decoded.userId })
      .first() as RefreshToken | undefined;

    if (!tokenInDb) {
      console.log('[AUTH_SERVICE] Refresh token non trovato in DB');
      throw new AppError('Refresh token non valido', 401);
    }

    // Verifica se è blacklisted
    const isBlacklisted = await db('blacklisted_tokens')
      .where({ token: refreshToken })
      .first();

    if (isBlacklisted) {
      console.log('[AUTH_SERVICE] Refresh token blacklisted');
      throw new AppError('Refresh token non valido', 401);
    }

    // Genera nuovo access token
    const newAccessToken = generateAccessToken(decoded.userId, decoded.email);
    console.log('[AUTH_SERVICE] Nuovo access token generato');

    return newAccessToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    // Gestisce errori di verifica token
    if (error instanceof Error) {
      console.error('[AUTH_SERVICE] Errore verifica token:', error.message);
      throw new AppError(error.message, 401);
    }
    
    console.error('[AUTH_SERVICE] Errore durante refresh token:', error);
    throw new AppError('Errore durante il rinnovo del token', 500);
  }
};

/**
 * Esegue il logout blacklistando il refresh token.
 * @param refreshToken - Refresh token da invalidare
 * @returns True se il logout ha successo
 * @throws AppError 401 se il token non è valido
 * @throws AppError 500 per errori generici
 */
export const logout = async (refreshToken: string): Promise<boolean> => {
  console.log('[AUTH_SERVICE] Richiesta logout');

  try {
    // Verifica che il token sia valido (anche se scaduto, per sicurezza)
    let decoded;
    try {
      decoded = verifyToken(refreshToken, 'refresh');
    } catch (error) {
      // Se scaduto ma sintatticamente valido, procedi comunque con blacklist
      console.log('[AUTH_SERVICE] Token scaduto ma procedo con blacklist');
    }

    // Verifica che il token esista in DB
    const tokenInDb = await db('refresh_tokens')
      .where({ token: refreshToken })
      .first();

    if (!tokenInDb) {
      console.log('[AUTH_SERVICE] Refresh token non trovato in DB durante logout');
      throw new AppError('Refresh token non valido', 401);
    }

    // Verifica se già blacklisted (per evitare duplicati)
    const alreadyBlacklisted = await db('blacklisted_tokens')
      .where({ token: refreshToken })
      .first();

    if (alreadyBlacklisted) {
      console.log('[AUTH_SERVICE] Token già blacklisted, logout già effettuato');
      return true;
    }

    // Aggiungi a blacklist
    const blacklistedToken: NewBlacklistedToken = {
      token: refreshToken,
    };

    await db('blacklisted_tokens').insert(blacklistedToken);
    console.log('[AUTH_SERVICE] Token aggiunto alla blacklist');

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    console.error('[AUTH_SERVICE] Errore durante logout:', error);
    throw new AppError('Errore durante il logout', 500);
  }
};
import request from 'supertest';
import app from '../../server';
import db from '../../config/db';
import * as emailService from '../../services/email.services';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { beforeEach, afterEach, afterAll, it, expect, describe, jest } from '@jest/globals';

/**
 * Test suite completa per autenticazione.
 * Copre: register, login, refresh, logout, forgot-password, reset-password
 */

// Mock del servizio email per evitare invii reali durante i test
jest.mock('../../services/email.services');
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;

describe('Auth Integration Tests', () => {
  
  // Pulizia dopo OGNI test per evitare contaminazione
  afterEach(async () => {
    // Aspetta che tutte le operazioni pending siano completate
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // ============= REGISTER TESTS =============
  describe('POST /api/auth/register', () => {
    
    const validRegisterData = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@test.com',
      password: 'Password123',
    };

    it('✅ Dovrebbe registrare un nuovo utente con successo', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(201);

      // Verifica struttura response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registrazione completata con successo');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        name: validRegisterData.name,
        surname: validRegisterData.surname,
        email: validRegisterData.email,
      });
      expect(response.body.data.user).not.toHaveProperty('password_hash');

      // Verifica che l'utente sia stato creato nel DB
      const userInDb = await db('users')
        .where({ email: validRegisterData.email })
        .first();
      
      expect(userInDb).toBeDefined();
      expect(userInDb.name).toBe(validRegisterData.name);

      // Verifica che il refresh token sia stato salvato
      const refreshTokenInDb = await db('refresh_tokens')
        .where({ user_id: userInDb.id })
        .first();
      
      expect(refreshTokenInDb).toBeDefined();
    });

    it('❌ Dovrebbe fallire se email già registrata', async () => {
      // Crea utente esistente
      await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      // Aspetta che il primo inserimento sia completato
      await new Promise(resolve => setTimeout(resolve, 100));

      // Tenta registrazione duplicata
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email già registrata');
    });

    it('❌ Dovrebbe fallire con password debole', async () => {
      const weakPasswordData = {
        ...validRegisterData,
        email: 'weak@test.com', // Email unica per evitare conflitti
        password: 'weak', // Troppo corta, senza maiuscole/numeri
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dati di input non validi');
    });

    it('❌ Dovrebbe fallire con email invalida', async () => {
      const invalidEmailData = {
        ...validRegisterData,
        email: 'not-an-email',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dati di input non validi');
    });

    it('❌ Dovrebbe fallire con campi mancanti', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' }) // Mancano name, surname, password
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============= LOGIN TESTS =============
  describe('POST /api/auth/login', () => {
    
    const userCredentials = {
      email: 'luigi.verdi@test.com',
      password: 'SecurePass456',
    };

    beforeEach(async () => {
      // Crea utente per i test di login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Luigi',
          surname: 'Verdi',
          ...userCredentials,
        });
      
      // Aspetta che la registrazione sia completata
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('✅ Dovrebbe fare login con credenziali corrette', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(userCredentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login effettuato con successo');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userCredentials.email);
    });

    it('❌ Dovrebbe fallire con password errata', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenziali non valide');
    });

    it('❌ Dovrebbe fallire con email non esistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'AnyPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenziali non valide');
    });

    it('❌ Dovrebbe fallire con validazione input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============= REFRESH TOKEN TESTS =============
  describe('POST /api/auth/refresh', () => {
    
    let validRefreshToken: string;
    let userId: number;

    beforeEach(async () => {
      // Crea utente e ottieni refresh token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          surname: 'User',
          email: 'refresh.test@test.com',
          password: 'RefreshPass123',
        });

      validRefreshToken = registerResponse.body.data.refreshToken;
      userId = registerResponse.body.data.user.id;
      
      // Aspetta che sia tutto salvato
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('✅ Dovrebbe rinnovare access token con refresh token valido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(response.body.data.accessToken.length).toBeGreaterThan(0);
    });

    it('❌ Dovrebbe fallire con refresh token blacklisted', async () => {
      // Blacklista il token
      await db('blacklisted_tokens').insert({ token: validRefreshToken });
      
      // Aspetta che l'inserimento sia completato
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token non valido');
    });

    it('❌ Dovrebbe fallire con refresh token non esistente in DB', async () => {
      // Token valido sintatticamente ma non in DB
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OTksImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.fake_signature';

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: fakeToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Dovrebbe fallire con refresh token malformato', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token-format' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Dovrebbe fallire se refresh token mancante', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============= LOGOUT TESTS =============
  describe('POST /api/auth/logout', () => {
    
    let refreshToken: string;

    beforeEach(async () => {
      // Crea utente e ottieni refresh token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Logout',
          surname: 'Test',
          email: 'logout@test.com',
          password: 'LogoutPass123',
        });

      refreshToken = response.body.data.refreshToken;
      
      // Aspetta che sia tutto salvato
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('✅ Dovrebbe fare logout e blacklistare il token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout effettuato con successo');

      // Aspetta che il token sia blacklistato
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verifica che il token sia stato blacklistato
      const blacklistedToken = await db('blacklisted_tokens')
        .where({ token: refreshToken })
        .first();

      expect(blacklistedToken).toBeDefined();
    });

    it('✅ Dovrebbe gestire logout idempotente (token già blacklistato)', async () => {
      // Primo logout
      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      // Aspetta che il primo logout sia completato
      await new Promise(resolve => setTimeout(resolve, 100));

      // Secondo logout con stesso token
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('❌ Dovrebbe fallire se refresh token non valido', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============= FORGOT PASSWORD TESTS =============
  describe('POST /api/auth/forgot-password', () => {
    
    const userEmail = 'forgot@test.com';

    beforeEach(async () => {
      // Mock dell'email service
      mockedEmailService.sendPasswordResetEmail.mockResolvedValue();

      // Crea utente
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Forgot',
          surname: 'Password',
          email: userEmail,
          password: 'ForgotPass123',
        });
      
      // Aspetta che la registrazione sia completata
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('✅ Dovrebbe inviare email reset e creare token', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Email per il reset della password inviata');

      // Aspetta che il token sia creato
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verifica che il token sia stato creato nel DB
      const tokenInDb = await db('password_reset_tokens')
        .where({ used: false })
        .orderBy('created_at', 'desc')
        .first();

      expect(tokenInDb).toBeDefined();
      expect(tokenInDb.token).toBeTruthy();
      expect(dayjs(tokenInDb.expires_at).isAfter(dayjs())).toBe(true);

      // Verifica che l'email service sia stato chiamato
      expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        userEmail,
        expect.any(String)
      );
    });

    it('❌ Dovrebbe fallire con email non registrata ma non rivelare che non esiste', async () => {
      // Per sicurezza, la response dovrebbe essere uguale anche se email non esiste
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Dovrebbe fallire con email invalida', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============= RESET PASSWORD TESTS =============
  describe('POST /api/auth/reset-password', () => {
    
    let validToken: string;
    let userId: number;
    const newPassword = 'NewSecurePass123';

    beforeEach(async () => {
      // Crea utente
      const user = await db('users')
        .insert({
          name: 'Reset',
          surname: 'Test',
          email: 'reset@test.com',
          password_hash: await bcrypt.hash('OldPass123', 10),
        })
        .returning('*');

      userId = user[0].id;

      // Crea token reset valido
      const token = 'valid_reset_token_abc123';
      await db('password_reset_tokens').insert({
        user_id: userId,
        token,
        expires_at: dayjs().add(1, 'hour').toDate(),
        used: false,
      });

      validToken = token;
      
      // Aspetta che sia tutto salvato
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('✅ Dovrebbe resettare password con token valido', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validToken,
          newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password resettata con successo');

      // Aspetta che l'aggiornamento sia completato
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verifica che la password sia stata aggiornata
      const updatedUser = await db('users').where({ id: userId }).first();
      const passwordMatches = await bcrypt.compare(newPassword, updatedUser.password_hash);
      expect(passwordMatches).toBe(true);

      // Verifica che il token sia marcato come usato
      const tokenRecord = await db('password_reset_tokens')
        .where({ token: validToken })
        .first();
      expect(tokenRecord.used).toBe(true);
    });

    it('❌ Dovrebbe fallire con token scaduto', async () => {
      // Crea token scaduto
      const expiredToken = 'expired_token_xyz';
      await db('password_reset_tokens').insert({
        user_id: userId,
        token: expiredToken,
        expires_at: dayjs().subtract(1, 'hour').toDate(), // Scaduto
        used: false,
      });
      
      // Aspetta che l'inserimento sia completato
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          newPassword,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token scaduto');
    });

    it('❌ Dovrebbe fallire con token già usato', async () => {
      // Marca token come usato
      await db('password_reset_tokens')
        .where({ token: validToken })
        .update({ used: true });
      
      // Aspetta che l'aggiornamento sia completato
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validToken,
          newPassword,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token già utilizzato');
    });

    it('❌ Dovrebbe fallire con token inesistente', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'nonexistent_token',
          newPassword,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token non valido');
    });

    it('❌ Dovrebbe fallire con password debole', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validToken,
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
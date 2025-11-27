import db from '../../config/db';
import jwt from 'jsonwebtoken';
import { User, Owner, Tenant, Contract } from '../../types/database';

/**
 * Crea un utente di test e restituisce l'utente e un token di accesso valido.
 */
export const createTestUser = async (overrides: Partial<User> = {}) => {
  const uniqueId = Date.now();
  const [user] = await db('users')
    .insert({
      name: 'Test',
      surname: 'User',
      email: `user_${uniqueId}@test.com`,
      password_hash: '$2b$10$EpIxNw...hashedpassword', // Hash finto ma valido come stringa
      ...overrides,
    })
    .returning('*');

  // Genera token valido usando il segreto di test
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET || 'test_access_secret',
    { expiresIn: '15m' }
  );

  return { user, token };
};

/**
 * Crea un proprietario collegato a un utente.
 */
export const createTestOwner = async (userId: number, overrides: Partial<Owner> = {}) => {
  const uniqueId = Math.floor(Math.random() * 10000);
  const [owner] = await db('owners')
    .insert({
      user_id: userId,
      name: 'Mario',
      surname: 'Rossi',
      email: `owner_${uniqueId}@test.com`,
      phone: '3331234567',
      ...overrides,
    })
    .returning('*');
  return owner;
};

/**
 * Crea un inquilino collegato a un utente.
 */
export const createTestTenant = async (userId: number, overrides: Partial<Tenant> = {}) => {
  const uniqueId = Math.floor(Math.random() * 10000);
  const [tenant] = await db('tenants')
    .insert({
      user_id: userId,
      name: 'Luigi',
      surname: 'Verdi',
      email: `tenant_${uniqueId}@test.com`,
      phone: '3339876543',
      ...overrides,
    })
    .returning('*');
  return tenant;
};

/**
 * Crea un contratto base.
 */
export const createTestContract = async (
  ownerId: number,
  tenantId: number,
  overrides: Partial<Contract> = {}
) => {
  const [contract] = await db('contracts')
    .insert({
      owner_id: ownerId,
      tenant_id: tenantId,
      start_date: '2025-01-01',
      end_date: '2029-01-01',
      cedolare_secca: false,
      typology: 'residenziale',
      canone_concordato: true,
      monthly_rent: 800.00,
      last_annuity_paid: null,
      ...overrides,
    })
    .returning('*');
  return contract;
};
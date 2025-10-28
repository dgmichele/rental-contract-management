import knex from '../config/db';
import { NewOwner, UpdateOwner, Owner, Contract } from '../types/database';
import AppError from '../utils/AppError';
import { Knex } from 'knex';

export const createOwner = async (user_id: number, ownerData: NewOwner): Promise<Owner> => {
  const [owner] = await knex<Owner>('owners')
    .insert({ ...ownerData, user_id })
    .returning('*');
  return owner;
};

export const getOwners = async (
  user_id: number,
  page: number,
  limit: number,
  search?: string
): Promise<{ data: Owner[]; total: number }> => {
  const query = knex<Owner>('owners').where({ user_id });

  if (search) {
    query.andWhere(function () {
      this.where('name', 'ilike', `%${search}%`).orWhere('surname', 'ilike', `%${search}%`);
    });
  }

  const [{ count }] = await query.clone().count<{ count: string }[]>('* as count');
  const total = parseInt(count, 10);

  const data = await query
    .clone()
    .offset((page - 1) * limit)
    .limit(limit)
    .orderBy('created_at', 'desc');

  return { data, total };
};

export const getOwnerById = async (user_id: number, owner_id: number): Promise<Owner> => {
  const owner = await knex<Owner>('owners').where({ id: owner_id, user_id }).first();
  if (!owner) throw new AppError('Owner non trovato o accesso negato', 404);
  return owner;
};

export const updateOwner = async (user_id: number, owner_id: number, payload: UpdateOwner): Promise<Owner> => {
  const owner = await getOwnerById(user_id, owner_id); // verifica ownership
  const [updatedOwner] = await knex<Owner>('owners')
    .where({ id: owner_id })
    .update(payload)
    .returning('*');
  return updatedOwner;
};

export const deleteOwner = async (user_id: number, owner_id: number): Promise<void> => {
  const owner = await getOwnerById(user_id, owner_id); // verifica ownership
  await knex.transaction(async (trx: Knex.Transaction) => {
    // Delete contracts associati
    await trx<Contract>('contracts').where({ owner_id }).del();
    // Delete owner
    await trx<Owner>('owners').where({ id: owner_id }).del();
  });
};

export const getOwnerContracts = async (
  user_id: number,
  owner_id: number,
  page: number,
  limit: number
): Promise<{ data: Contract[]; total: number }> => {
  const owner = await getOwnerById(user_id, owner_id); // verifica ownership

  const [{ count }] = await knex<Contract>('contracts')
    .where({ owner_id: owner.id })
    .count<{ count: string }[]>('* as count');

  const total = parseInt(count, 10);

  const data = await knex<Contract>('contracts')
    .where({ owner_id: owner.id })
    .offset((page - 1) * limit)
    .limit(limit)
    .orderBy('start_date', 'desc');

  return { data, total };
};
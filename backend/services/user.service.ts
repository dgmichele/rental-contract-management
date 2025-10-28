import bcrypt from 'bcrypt';
import db from '../config/db';
import AppError from '../utils/AppError';
import { UpdateUserRequest } from '../types/database';

export const getUserById = async (userId: number) => {
  const user = await db('users')
    .select('id', 'name', 'surname', 'email', 'created_at', 'updated_at')
    .where({ id: userId })
    .first();

  if (!user) throw new AppError('Utente non trovato', 404);
  return user;
};

export const updateUserDetails = async (userId: number, data: UpdateUserRequest) => {
  // Verifica unicità email
  const emailExists = await db('users')
    .where({ email: data.email })
    .andWhereNot({ id: userId })
    .first();

  if (emailExists) throw new AppError('Email già in uso', 409);

  await db('users')
    .where({ id: userId })
    .update({
      name: data.name,
      surname: data.surname,
      email: data.email,
      updated_at: new Date(),
    });

  return getUserById(userId);
};

export const updateUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  return await db.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).first();

    if (!user) throw new AppError('Utente non trovato', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) throw new AppError('Password attuale non corretta', 400);

    const newHash = await bcrypt.hash(newPassword, 10);

    await trx('users')
      .where({ id: userId })
      .update({
        password_hash: newHash,
        updated_at: new Date(),
      });

    return true;
  });
};

import * as path from 'path';
import * as dotenv from 'dotenv';
import { Knex, knex } from 'knex';

/**
 * Setup globale Jest - Eseguito UNA VOLTA prima di tutti i test.
 * Crea il database di test se non esiste e carica le variabili d'ambiente.
 */
export default async (): Promise<void> => {
  console.log('[JEST_GLOBAL_SETUP] 🚀 Inizio setup globale test');
  
  // Carica .env.test
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });
  
  console.log('[JEST_GLOBAL_SETUP] ✅ Variabili d\'ambiente test caricate');
  console.log('[JEST_GLOBAL_SETUP] DB_NAME:', process.env.DB_NAME);
  
  // Connessione al database postgres di default per creare il DB di test
  const adminDb: Knex = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Database di sistema per operazioni admin
    },
  });

  try {
    // Verifica se il database di test esiste
    const testDbName = process.env.DB_NAME || 'rental_contract_management_test';
    
    const result = await adminDb.raw(
      `SELECT 1 FROM pg_database WHERE datname = ?`,
      [testDbName]
    );

    // Se non esiste, crealo
    if (result.rows.length === 0) {
      console.log(`[JEST_GLOBAL_SETUP] Database "${testDbName}" non trovato, creazione in corso...`);
      
      await adminDb.raw(`CREATE DATABASE ${testDbName}`);
      
      console.log(`[JEST_GLOBAL_SETUP] ✅ Database "${testDbName}" creato con successo`);
    } else {
      console.log(`[JEST_GLOBAL_SETUP] ✅ Database "${testDbName}" già esistente`);
    }
  } catch (error) {
    console.error('[JEST_GLOBAL_SETUP] ❌ Errore durante setup:', error);
    throw error;
  } finally {
    // Chiudi connessione admin
    await adminDb.destroy();
    console.log('[JEST_GLOBAL_SETUP] ✅ Setup globale completato');
  }
};

import db from '../config/db';
import * as path from 'path';
import { beforeAll, beforeEach, afterAll } from '@jest/globals';

/**
 * Setup per ogni test suite.
 * - beforeAll: Esegue migrations e verifica connessione
 * - beforeEach: Pulisce tutte le tabelle (in ordine corretto per FK)
 * - afterAll: Chiude connessione DB
 */

beforeAll(async () => {
  console.log('[TEST_SETUP] 🚀 Inizio setup test suite');
  console.log('[TEST_SETUP] NODE_ENV:', process.env.NODE_ENV);
  console.log('[TEST_SETUP] DB_NAME:', process.env.DB_NAME);
  
  try {
    // Verifica connessione DB
    await db.raw('SELECT 1');
    console.log('[TEST_SETUP] ✅ Connessione DB stabilita');

    // Rollback di tutte le migrations (per partire puliti)
    await db.migrate.rollback(
      {
        directory: path.resolve(__dirname, '..', 'db', 'migrations'),
      },
      true // all: true = rollback completo
    );
    console.log('[TEST_SETUP] ✅ Rollback migrations completato');

    // Esegui tutte le migrations (crea tutte le tabelle)
    await db.migrate.latest({
      directory: path.resolve(__dirname, '..', 'db', 'migrations'),
    });
    console.log('[TEST_SETUP] ✅ Migrations completate');

    // Verifica che le tabelle siano state create
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('[TEST_SETUP] ✅ Tabelle create:', tables.rows.map((r: any) => r.table_name).join(', '));
  } catch (error) {
    console.error('[TEST_SETUP] ❌ Errore setup:', error);
    throw error;
  }
}, 30000); // Timeout 30s per migrations

beforeEach(async () => {
  console.log('[TEST_SETUP] 🧹 Pulizia tabelle...');
  
  try {
    // IMPORTANTE: Pulisci in ordine inverso alle dipendenze (per rispettare FK)
    // Le tabelle figlie vanno eliminate prima delle tabelle parent
    
    // Usa TRUNCATE CASCADE per una pulizia più robusta e veloce
    await db.raw('TRUNCATE TABLE notifications CASCADE');
    await db.raw('TRUNCATE TABLE annuities CASCADE');
    await db.raw('TRUNCATE TABLE contracts CASCADE');
    await db.raw('TRUNCATE TABLE tenants CASCADE');
    await db.raw('TRUNCATE TABLE owners CASCADE');
    await db.raw('TRUNCATE TABLE blacklisted_tokens CASCADE');
    await db.raw('TRUNCATE TABLE refresh_tokens CASCADE');
    await db.raw('TRUNCATE TABLE password_reset_tokens CASCADE');
    await db.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    
    // Aspetta che tutte le operazioni siano completate
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('[TEST_SETUP] ✅ Tabelle pulite');
  } catch (error) {
    console.error('[TEST_SETUP] ❌ Errore pulizia tabelle:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('[TEST_SETUP] 🛑 Chiusura connessione DB');
  
  try {
    // Aspetta che tutte le query pending siano completate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Chiudi tutte le connessioni al pool
    await db.destroy();
    
    console.log('[TEST_SETUP] ✅ Connessione DB chiusa');
  } catch (error) {
    console.error('[TEST_SETUP] ❌ Errore chiusura DB:', error);
  }
});
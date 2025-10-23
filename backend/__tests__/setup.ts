import db from '../config/db';
import * as path from 'path';


/**
 * Setup globale per tutti i test.
 * - beforeAll: Esegue migrations sul DB di test
 * - beforeEach: Pulisce tutte le tabelle prima di ogni test
 * - afterAll: Chiude connessione DB
 */

beforeAll(async () => {
  console.log('[TEST_SETUP] 🚀 Inizio setup test suite');
  
  try {
    // Verifica connessione DB
    await db.raw('SELECT 1');
    console.log('[TEST_SETUP] ✅ Connessione DB stabilita');

    // Esegui migrations (crea tutte le tabelle)
    await db.migrate.latest({
      directory: path.resolve(__dirname, '..', 'db', 'migrations'),
    });
    console.log('[TEST_SETUP] ✅ Migrations completate');
  } catch (error) {
    console.error('[TEST_SETUP] ❌ Errore setup:', error);
    throw error;
  }
});

beforeEach(async () => {
  console.log('[TEST_SETUP] 🧹 Pulizia tabelle...');
  
  try {
    // Pulisci tutte le tabelle in ordine inverso alle dipendenze
    // (per rispettare i foreign key constraints)
    await db('notifications').del();
    await db('annuities').del();
    await db('contracts').del();
    await db('tenants').del();
    await db('owners').del();
    await db('blacklisted_tokens').del();
    await db('refresh_tokens').del();
    await db('password_reset_tokens').del();
    await db('users').del();
    
    console.log('[TEST_SETUP] ✅ Tabelle pulite');
  } catch (error) {
    console.error('[TEST_SETUP] ❌ Errore pulizia tabelle:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('[TEST_SETUP] 🛑 Chiusura connessione DB');
  
  try {
    await db.destroy();
    console.log('[TEST_SETUP] ✅ Connessione DB chiusa');
  } catch (error) {
    console.error('[TEST_SETUP] ❌ Errore chiusura DB:', error);
  }
});
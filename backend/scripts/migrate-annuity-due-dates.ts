/**
 * ============================================================
 * SCRIPT DI MIGRAZIONE — ONE-SHOT
 * migrate-annuity-due-dates.ts
 * ============================================================
 * 
 * Obiettivo: Aggiorna le due_date di tutte le annualità esistenti
 * usando end_date come riferimento per giorno/mese (nuova logica),
 * invece di start_date (vecchia logica).
 * 
 * SOLO per contratti con cedolare_secca = false.
 * Non tocca: is_paid, paid_at, year, o qualsiasi altro campo.
 * 
 * Esecuzione:
 *   npx ts-node scripts/migrate-annuity-due-dates.ts
 * 
 * ⚠️ ESEGUI PRIMA IN LOCALE, POI IN PRODUZIONE.
 * ⚠️ QUESTO SCRIPT VA ELIMINATO DOPO L'USO.
 * ============================================================
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Sviluppo locale: carica .env.dev se esiste.
// Produzione (cPanel): le variabili sono già in process.env, il file non esiste e dotenv fallisce silenziosamente. OK.
dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

import db from '../config/db';
import dayjs from 'dayjs';

const run = async () => {
  console.log('============================================================');
  console.log('🚀 MIGRAZIONE due_date annuità: start_date → end_date');
  console.log('============================================================\n');

  const stats = {
    contractsProcessed: 0,
    annuitiesUpdated: 0,
    annuitiesSkipped: 0,
    errors: 0,
  };

  try {
    // 1. Recupera tutti i contratti NON in cedolare secca
    const contracts = await db('contracts')
      .where('cedolare_secca', false)
      .select('id', 'start_date', 'end_date');

    console.log(`📋 Contratti da processare (cedolare_secca=false): ${contracts.length}\n`);

    // 2. Per ogni contratto, ricalcola le due_date delle annualità
    for (const contract of contracts) {
      stats.contractsProcessed++;

      const endDate = dayjs(contract.end_date);
      const endDay = endDate.date();
      const endMonth = endDate.month(); // 0-indexed in dayjs

      console.log(`\n📄 Contratto ID: ${contract.id}`);
      console.log(`   start_date: ${contract.start_date} | end_date: ${contract.end_date}`);
      console.log(`   Riferimento giorno/mese: ${String(endDay).padStart(2, '0')}/${String(endMonth + 1).padStart(2, '0')}`);

      // Recupera tutte le annualità di questo contratto
      const annuities = await db('annuities')
        .where('contract_id', contract.id)
        .select('id', 'year', 'due_date');

      if (annuities.length === 0) {
        console.log('   ℹ️  Nessuna annualità trovata, skip.');
        continue;
      }

      for (const annuity of annuities) {
        // Calcola la nuova due_date: stesso giorno/mese di end_date, anno dell'annualità
        const newDueDate = endDate
          .year(annuity.year)
          .format('YYYY-MM-DD');

        const oldDueDate = dayjs(annuity.due_date).format('YYYY-MM-DD');

        if (oldDueDate === newDueDate) {
          console.log(`   ✅ Anno ${annuity.year}: due_date già corretta (${oldDueDate}), skip.`);
          stats.annuitiesSkipped++;
          continue;
        }

        // Aggiorna solo la due_date
        await db('annuities')
          .where('id', annuity.id)
          .update({
            due_date: newDueDate,
            updated_at: new Date(),
          });

        console.log(`   📅 Anno ${annuity.year}: ${oldDueDate} → ${newDueDate} ✅`);
        stats.annuitiesUpdated++;
      }
    }

  } catch (error) {
    console.error('\n❌ Errore fatale durante la migrazione:', error);
    stats.errors++;
  } finally {
    await db.destroy();
  }

  console.log('\n============================================================');
  console.log('🏁 MIGRAZIONE COMPLETATA');
  console.log(`   Contratti processati: ${stats.contractsProcessed}`);
  console.log(`   Annualità aggiornate: ${stats.annuitiesUpdated}`);
  console.log(`   Annualità già corrette (skip): ${stats.annuitiesSkipped}`);
  console.log(`   Errori: ${stats.errors}`);
  console.log('============================================================');

  if (stats.errors > 0) {
    process.exit(1);
  }
};

run();

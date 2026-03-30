import dayjs from 'dayjs';
import db from '../config/db';
import { 
  NotificationType, 
  NewNotification 
} from '../types/database';
import { ContractWithRelations } from '../types/api';
import * as emailService from './email.service';
import { logCron, logCronError } from './logger.service';
import { parseDecimal } from '../utils/contract.utils';

/**
 * Tenta di inserire la notifica nel DB.
 * Essendo protetto a monte dal lock advisory del cron, non c'è più
 * il rischio di race condition tra istanze multiple.
 * * @param contractId - ID del contratto
 * @param type - Tipo di notifica ('contract_renewal' o 'annuity_renewal')
 * @param year - Anno di riferimento (anno di scadenza per rinnovo contratto, indice anno per annualità)
 * @returns true se la notifica è stata inserita (non esisteva), false altrimenti
 */
export const claimNotification = async (
  contractId: number, 
  type: NotificationType, 
  year: number | null
): Promise<boolean> => {
  try {
    // Transazione normale READ COMMITTED
    const result = await db.transaction(async (trx) => {
      let existingQuery = trx('notifications')
        .where({ contract_id: contractId, type: type });
      
      if (year !== null) {
        existingQuery = existingQuery.where('year', year);
      } else {
        existingQuery = existingQuery.whereNull('year');
      }

      const existing = await existingQuery.first();
      
      if (existing) {
        // La notifica esiste già (es. inviata in un'esecuzione di un giorno precedente)
        return null;
      }

      const [inserted] = await trx('notifications').insert({
        contract_id: contractId,
        type: type,
        year: year,
        sent_to_client: false,
        sent_at: new Date(),
      }).returning('id');

      return inserted;
    });

    const claimed = result !== null;
    
    if (claimed) {
      logCron(`[NOTIFICATION_SERVICE] 🔒 Notifica creata con successo (ID: ${result.id}) per contratto ${contractId}, tipo: ${type}, anno: ${year}`);
    } else {
      logCron(`[NOTIFICATION_SERVICE] ⏭️ Notifica già esistente per contratto ${contractId}, tipo: ${type}, anno: ${year}`);
    }

    return claimed;
  } catch (error) {
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore durante inserimento notifica per contratto ${contractId}:`, error);
    return false;
  }
};

/**
 * Aggiorna lo stato di invio della notifica dopo l'effettivo invio delle email.
 * 
 * @param contractId - ID del contratto
 * @param type - Tipo di notifica
 * @param year - Anno di riferimento
 * @param sentToClient - Se l'email al cliente è stata inviata
 */
const updateNotificationStatus = async (
  contractId: number,
  type: NotificationType,
  year: number | null,
  sentToClient: boolean
): Promise<void> => {
  try {
    const query = db('notifications')
      .where({ contract_id: contractId, type: type });

    if (year !== null) {
      query.where('year', year);
    } else {
      query.whereNull('year');
    }

    await query.update({
      sent_to_client: sentToClient,
    });
  } catch (error) {
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore aggiornamento stato notifica:`, error);
  }
};

/**
 * Helper interno (System Level) per recuperare il contratto con tutte le relazioni.
 * NOTA: A differenza di contract.service.ts, questa funzione NON richiede userId.
 * Viene usata dal sistema (Cron Job) che ha permessi globali di lettura.
 * 
 * @param contractId - ID del contratto da recuperare
 */
const getFullContract = async (contractId: number): Promise<ContractWithRelations | null> => {
  // 1. Recupera il contratto raw
  const contract = await db('contracts').where('id', contractId).first();
  if (!contract) return null;

  // 2. Recupera owner, tenant e annuities in parallelo
  const [owner, tenant, annuities] = await Promise.all([
    db('owners').where('id', contract.owner_id).first(),
    db('tenants').where('id', contract.tenant_id).first(),
    db('annuities').where('contract_id', contractId).orderBy('year', 'asc')
  ]);

  if (!owner || !tenant) {
    logCronError(`[NOTIFICATION_SERVICE] ❌ Dati incompleti (manca owner/tenant) per contratto ${contractId}`);
    return null;
  }

  // 3. Costruisce l'oggetto tipizzato ContractWithRelations
  return {
    ...contract,
    monthly_rent: parseDecimal(contract.monthly_rent),
    owner,
    tenant,
    annuities,
  };
};

/**
 * Funzione principale eseguita dal Cron Job (default: ogni giorno alle 08:00).
 * * Utilizza pg_try_advisory_lock per garantire che, in presenza di più worker/istanze,
 * solo uno esegua effettivamente il job.
 * * @returns Oggetto con statistiche sull'esecuzione
 */
export const sendExpiringContractsNotifications = async () => {
  // Chiave arbitraria per il lock del DB (deve essere un intero a 64-bit univoco per questo specifico job)
  const LOCK_KEY = 123456789;
  
  // 1. Tenta di acquisire il lock a livello di database
  const lockAcquired = await db.raw(
    'SELECT pg_try_advisory_lock(?)', [LOCK_KEY]
  );
  
  if (!lockAcquired.rows[0].pg_try_advisory_lock) {
    logCron('[NOTIFICATION_SERVICE] ⏭️ Job scadenze già in esecuzione su altro processo (lock negato), skip.');
    return { processed: 0, sent: 0, skipped: 0, failed: 0 };
  }

  logCron('[NOTIFICATION_SERVICE] 🔐 Lock advisory acquisito, avvio job scadenze.');

  const stats = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0
  };

  try {
    // Configurazione giorni da env o default a 7
    const daysBefore = parseInt(process.env.CRON_NOTIFICATION_DAYS_BEFORE || '7', 10);
    const targetDate = dayjs().add(daysBefore, 'day').format('YYYY-MM-DD');

    logCron(`[NOTIFICATION_SERVICE] 🚀 Check scadenze per data target: ${targetDate}`);

    try {
      // ==========================================
      // 1. GESTIONE SCADENZA CONTRATTI (FINE NATURALE)
      // ==========================================
      const expiringContracts = await db('contracts')
        .where('end_date', targetDate); 

      for (const contract of expiringContracts) {
        stats.processed++;

        const expiryYear = dayjs(contract.end_date).year();
        const claimed = await claimNotification(contract.id, 'contract_renewal', expiryYear);
        if (!claimed) {
          stats.skipped++;
          continue;
        }

        const fullContract = await getFullContract(contract.id);
        if (!fullContract) {
          stats.failed++;
          continue;
        }

        if (!fullContract.owner.email) {
          logCron(`[NOTIFICATION_SERVICE] ⏭️ Nessuna email owner per contratto ID: ${contract.id}, skip invio email.`);
          await updateNotificationStatus(contract.id, 'contract_renewal', expiryYear, false);
          stats.skipped++;
          continue;
        }

        logCron(`[NOTIFICATION_SERVICE] 📧 Invio reminder CONTRATTO ID: ${contract.id}`);

        const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'contract');

        if (sentClient) {
          await updateNotificationStatus(contract.id, 'contract_renewal', expiryYear, true);
          stats.sent++;
        } else {
          logCronError(`[NOTIFICATION_SERVICE] ❌ Invio email fallito per contratto ${contract.id}`);
          stats.failed++;
        }
      }

      // ==========================================
      // 2. GESTIONE SCADENZA ANNUALITÀ (INTERMEDIE)
      // ==========================================
      const expiringAnnuities = await db('annuities')
        .where('due_date', targetDate)
        .andWhere('is_paid', false);

      for (const annuity of expiringAnnuities) {
        stats.processed++;

        const claimed = await claimNotification(annuity.contract_id, 'annuity_renewal', annuity.year);
        if (!claimed) {
          stats.skipped++;
          continue;
        }

        const fullContract = await getFullContract(annuity.contract_id);
        if (!fullContract) {
          stats.failed++;
          continue;
        }

        if (!fullContract.owner.email) {
          logCron(`[NOTIFICATION_SERVICE] ⏭️ Nessuna email owner per annualità ${annuity.year} Contratto ID: ${annuity.contract_id}, skip.`);
          await updateNotificationStatus(annuity.contract_id, 'annuity_renewal', annuity.year, false);
          stats.skipped++;
          continue;
        }

        logCron(`[NOTIFICATION_SERVICE] 📧 Invio reminder ANNUALITÀ ${annuity.year} Contratto ID: ${annuity.contract_id}`);

        const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'annuity', annuity.year);

        if (sentClient) {
          await updateNotificationStatus(annuity.contract_id, 'annuity_renewal', annuity.year, true);
          stats.sent++;
        } else {
          logCronError(`[NOTIFICATION_SERVICE] ❌ Invio email fallito per annualità contratto ${annuity.contract_id}`);
          stats.failed++;
        }
      }

    } catch (error) {
      logCronError('[NOTIFICATION_SERVICE] ❌ Errore critico durante esecuzione job:', error);
    }
  } finally {
    // 2. Rilascia SEMPRE il lock alla fine, anche se il job fallisce,
    // altrimenti il job non potrà MAI più ripartire finché non si riavvia il DB o scade la sessione.
    await db.raw('SELECT pg_advisory_unlock(?)', [LOCK_KEY]);
    logCron('[NOTIFICATION_SERVICE] 🔓 Lock advisory rilasciato correttamente.');
  }

  logCron('[NOTIFICATION_SERVICE] 🏁 Job completato. Statistiche:', stats);
  return stats;
};
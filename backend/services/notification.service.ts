import dayjs from 'dayjs';
import db from '../config/db';
import { 
  NotificationType, 
  NewNotification 
} from '../types/database';
import { ContractWithRelations } from '../types/api';
import * as emailService from './email.service';
import { logCron, logCronError } from './logger.service';

/**
 * Tenta di "reclamare" una notifica inserendola atomicamente nel DB.
 * Usa INSERT ... ON CONFLICT DO NOTHING per garantire che solo un processo
 * riesca a inserire la notifica (vince la race condition).
 * 
 * Questo approccio elimina il problema TOCTOU (Time-of-Check to Time-of-Use):
 * - VECCHIO: CHECK → SEND → INSERT (due processi possono entrambi passare il CHECK)
 * - NUOVO: INSERT (atomico) → SEND solo se INSERT riuscito
 * 
 * @param contractId - ID del contratto
 * @param type - Tipo di notifica ('contract_renewal' o 'annuity_renewal')
 * @param year - Anno di riferimento (anno di scadenza per rinnovo contratto, indice anno per annualità)
 * @returns true se questo processo ha "reclamato" la notifica, false se già esisteva
 */
export const claimNotification = async (
  contractId: number, 
  type: NotificationType, 
  year: number | null
): Promise<boolean> => {
  try {
    // PostgreSQL gotcha: NULL ≠ NULL nel UNIQUE constraint.
    // Quindi ON CONFLICT non funziona con year=NULL (contract_renewal).
    // Soluzione: usiamo una transazione SERIALIZABLE con SELECT FOR UPDATE + INSERT.
    // Questo garantisce atomicità anche con valori NULL.
    
    const result = await db.transaction(async (trx) => {
      // 1. Prova a leggere con lock esclusivo (FOR UPDATE)
      let existingQuery = trx('notifications')
        .where({ contract_id: contractId, type: type });
      
      if (year !== null) {
        existingQuery = existingQuery.where('year', year);
      } else {
        existingQuery = existingQuery.whereNull('year');
      }

      // FOR UPDATE: blocca la riga se esiste, impedendo letture concorrenti
      const existing = await existingQuery.forUpdate().first();
      
      if (existing) {
        // Già inviata da un altro processo
        return null;
      }

      // 2. Non esiste → inserisci (all'interno della stessa transaction)
      const [inserted] = await trx('notifications').insert({
        contract_id: contractId,
        type: type,
        year: year,
        sent_to_client: false,
        sent_to_internal: false,
        sent_at: new Date(),
      }).returning('id');

      return inserted;
    }, { isolationLevel: 'serializable' });

    const claimed = result !== null;
    
    if (claimed) {
      logCron(`[NOTIFICATION_SERVICE] 🔒 Notifica reclamata con successo (ID: ${result.id}) per contratto ${contractId}, tipo: ${type}, anno: ${year}`);
    } else {
      logCron(`[NOTIFICATION_SERVICE] ⏭️ Notifica già reclamata da altro processo per contratto ${contractId}, tipo: ${type}, anno: ${year}`);
    }

    return claimed;
  } catch (error) {
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore durante claim notifica per contratto ${contractId}:`, error);
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
 * @param sentToInternal - Se l'email interna è stata inviata
 */
const updateNotificationStatus = async (
  contractId: number,
  type: NotificationType,
  year: number | null,
  sentToClient: boolean,
  sentToInternal: boolean
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
      sent_to_internal: sentToInternal,
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

  // 3. Recupera l'email dell'utente gestore (User) associato all'owner
  const managingUser = await db('users')
    .select('email')
    .where('id', owner.user_id)
    .first();

  // 4. Costruisce l'oggetto tipizzato ContractWithRelations
  return {
    ...contract,
    monthly_rent: typeof contract.monthly_rent === 'string' ? parseFloat(contract.monthly_rent) : contract.monthly_rent,
    owner,
    tenant,
    annuities,
    userEmail: managingUser?.email // ⭐ NUOVO: Aggiunge email utente per notifiche interne
  };
};

/**
 * Funzione principale eseguita dal Cron Job (default: ogni giorno alle 08:00).
 * 
 * Logica ANTI-DUPLICATI (atomica):
 * 1. Calcola la data target (oggi + N giorni).
 * 2. Cerca contratti/annualità in scadenza.
 * 3. Per ogni match: PRIMA inserisce la notifica nel DB (atomico con ON CONFLICT).
 * 4. Solo se l'inserimento riesce (= questo processo ha "vinto"), invia le email.
 * 5. Aggiorna lo stato della notifica con i risultati dell'invio.
 * 
 * Questo garantisce che anche con N istanze del server (es. cPanel con multipli worker),
 * le email vengono inviate una sola volta.
 * 
 * @returns Oggetto con statistiche sull'esecuzione
 */
export const sendExpiringContractsNotifications = async () => {
  // Configurazione giorni da env o default a 7
  const daysBefore = parseInt(process.env.CRON_NOTIFICATION_DAYS_BEFORE || '7', 10);
  
  // Calcola data target formattata YYYY-MM-DD per match esatto DB
  const targetDate = dayjs().add(daysBefore, 'day').format('YYYY-MM-DD');

  logCron(`[NOTIFICATION_SERVICE] 🚀 Avvio check scadenze per data target: ${targetDate}`);

  const stats = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0
  };

  try {
    // ==========================================
    // 1. GESTIONE SCADENZA CONTRATTI (FINE NATURALE)
    // ==========================================
    const expiringContracts = await db('contracts')
      .where('end_date', targetDate); // Scadenza esatta tra N giorni

    for (const contract of expiringContracts) {
      stats.processed++;

      // CLAIM ATOMICO: tenta di inserire la notifica nel DB.
      // Se un altro processo/istanza ha già inserito → skip (claimed = false)
      // ⭐ Usa l'anno di scadenza come identificativo unico per permettere nuovi invii post-rinnovo
      const expiryYear = dayjs(contract.end_date).year();
      const claimed = await claimNotification(contract.id, 'contract_renewal', expiryYear);
      if (!claimed) {
        stats.skipped++;
        continue;
      }

      // Recupera dati completi (System Level Fetch)
      const fullContract = await getFullContract(contract.id);
      if (!fullContract) {
        stats.failed++;
        continue;
      }

      logCron(`[NOTIFICATION_SERVICE] 📧 Invio reminder CONTRATTO ID: ${contract.id}`);

      // Invia email (Best effort) — solo questo processo le invia
      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'contract');
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'contract');

      if (sentInternal || sentClient) {
        // Aggiorna lo stato della notifica con i risultati effettivi
        await updateNotificationStatus(contract.id, 'contract_renewal', expiryYear, sentClient, sentInternal);
        stats.sent++;
      } else {
        logCronError(`[NOTIFICATION_SERVICE] ❌ Tutti i tentativi email falliti per contratto ${contract.id}`);
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

      // CLAIM ATOMICO: tenta di inserire la notifica nel DB
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

      logCron(`[NOTIFICATION_SERVICE] 📧 Invio reminder ANNUALITÀ ${annuity.year} Contratto ID: ${annuity.contract_id}`);

      // Invia email — solo questo processo le invia
      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'annuity', annuity.year);
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'annuity', annuity.year);

      if (sentInternal || sentClient) {
        await updateNotificationStatus(annuity.contract_id, 'annuity_renewal', annuity.year, sentClient, sentInternal);
        stats.sent++;
      } else {
        logCronError(`[NOTIFICATION_SERVICE] ❌ Tutti i tentativi email falliti per annualità contratto ${annuity.contract_id}`);
        stats.failed++;
      }
    }

  } catch (error) {
    logCronError('[NOTIFICATION_SERVICE] ❌ Errore critico durante esecuzione job:', error);
    // Non rilanciamo l'errore per non far crashare il processo Node principale se il cron fallisce
  }

  logCron('[NOTIFICATION_SERVICE] 🏁 Job completato. Statistiche:', stats);
  return stats;
};
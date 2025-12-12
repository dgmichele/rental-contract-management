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
 * Verifica se una notifica è già stata inviata per un determinato contratto/tipo/anno.
 * Previene l'invio di email duplicate (spam) al cliente o al team.
 * * @param contractId - ID del contratto
 * @param type - Tipo di notifica ('contract_renewal' o 'annuity_renewal')
 * @param year - Anno di riferimento (opzionale, null per rinnovo contratto)
 * @returns true se la notifica esiste già, false altrimenti
 */
export const checkNotificationSent = async (
  contractId: number, 
  type: NotificationType, 
  year?: number | null
): Promise<boolean> => {
  const query = db('notifications')
    .where({
      contract_id: contractId,
      type: type
    })
    .first();

  if (year !== undefined && year !== null) {
    query.where('year', year);
  } else {
    query.whereNull('year');
  }

  const existing = await query;
  return !!existing;
};

/**
 * Helper interno (System Level) per recuperare il contratto con tutte le relazioni.
 * NOTA: A differenza di contract.service.ts, questa funzione NON richiede userId.
 * Viene usata dal sistema (Cron Job) che ha permessi globali di lettura.
 * * @param contractId - ID del contratto da recuperare
 */
const getFullContract = async (contractId: number): Promise<ContractWithRelations | null> => {
  // 1. Recupera il contratto raw
  const contract = await db('contracts').where('id', contractId).first();
  if (!contract) return null;

  // 2. Recupera owner, tenant e annuities in parallelo per efficienza
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
  // Allineato con la logica di contract.service.ts (es. parsing monthly_rent)
  return {
    ...contract,
    monthly_rent: typeof contract.monthly_rent === 'string' ? parseFloat(contract.monthly_rent) : contract.monthly_rent,
    owner,
    tenant,
    annuities
  };
};

/**
 * Funzione principale eseguita dal Cron Job (default: ogni giorno alle 08:00).
 * Logica:
 * 1. Calcola la data target (oggi + N giorni).
 * 2. Cerca contratti in scadenza naturale (end_date).
 * 3. Cerca annualità in scadenza (due_date) non pagate.
 * 4. Invia email e registra la notifica per evitare duplicati.
 * * @returns Oggetto con statistiche sull'esecuzione
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

      // Verifica anti-duplicati
      const alreadySent = await checkNotificationSent(contract.id, 'contract_renewal', null);
      if (alreadySent) {
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

      // Invia email (Best effort)
      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'contract');
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'contract');

      // Registra notifica se almeno un invio è riuscito
      if (sentInternal || sentClient) {
        const newNotification: NewNotification = {
          contract_id: contract.id,
          type: 'contract_renewal',
          year: null,
          sent_to_client: sentClient,
          sent_to_internal: sentInternal,
          sent_at: new Date()
        };

        await db('notifications').insert(newNotification);
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

      // Verifica anti-duplicati
      const alreadySent = await checkNotificationSent(annuity.contract_id, 'annuity_renewal', annuity.year);
      if (alreadySent) {
        stats.skipped++;
        continue;
      }

      const fullContract = await getFullContract(annuity.contract_id);
      if (!fullContract) {
        stats.failed++;
        continue;
      }

      logCron(`[NOTIFICATION_SERVICE] 📧 Invio reminder ANNUALITÀ ${annuity.year} Contratto ID: ${annuity.contract_id}`);

      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'annuity', annuity.year);
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'annuity', annuity.year);

      if (sentInternal || sentClient) {
        const newNotification: NewNotification = {
          contract_id: annuity.contract_id,
          type: 'annuity_renewal',
          year: annuity.year,
          sent_to_client: sentClient,
          sent_to_internal: sentInternal,
          sent_at: new Date()
        };

        await db('notifications').insert(newNotification);
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
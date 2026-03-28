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
 * Tenta di "reclamare" una notifica inserendola atomicamente nel DB.
 * Questa versione restituisce l'ID del record creato per permettere
 * aggiornamenti successivi fuori dalla transazione iniziale.
 */
export const claimNotification = async (
  contractId: number, 
  type: NotificationType, 
  year: number | null
): Promise<number | null> => {
  try {
    // Usiamo .returning('id') per avere l'ID del record appena creato.
    // L'operazione è atomica grazie a ON CONFLICT.
    const result = await db('notifications')
      .insert({
        contract_id: contractId,
        type: type,
        year: year,
        sent_to_client: false,
        sent_to_internal: false,
        sent_at: new Date()
      })
      .onConflict(['contract_id', 'type', 'year'])
      .ignore()
      .returning('id');

    if (result && result.length > 0) {
      const newId = result[0].id;
      logCron(`[NOTIFICATION_SERVICE] 🔒 Notifica creata con successo (ID: ${newId}) per contratto ${contractId}`);
      return newId;
    }

    // Se result è vuoto, significa che il record esisteva già (conflitto gestito)
    return null; 
  } catch (error: any) {
    // Gestione specifica per l'errore di serializzazione di PostgreSQL (codice 40001)
    // causato dai due cron job simultanei di cPanel
    if (error.code === '40001') {
      logCron(`[NOTIFICATION_SERVICE] ⚠️ Conflitto di serializzazione rilevato. Un altro processo ha vinto la corsa.`);
      return null;
    }
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore durante claim notifica per contratto ${contractId}:`, error);
    return null;
  }
};

/**
 * Aggiorna lo stato di una notifica esistente dopo l'invio delle email.
 */
export const updateNotificationStatus = async (
  id: number,
  sentToClient: boolean,
  sentToInternal: boolean
): Promise<void> => {
  try {
    await db('notifications')
      .where('id', id)
      .update({
        sent_to_client: sentToClient,
        sent_to_internal: sentToInternal,
        sent_at: new Date() // Aggiorna al timestamp reale di invio
      });
  } catch (error) {
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore aggiornamento stato notifica ${id}:`, error);
  }
};

/**
 * Funzione principale: scansiona e invia notifiche per contratti in scadenza.
 */
export const sendExpiringContractsNotifications = async () => {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  const targetDate = dayjs().add(7, 'day').format('YYYY-MM-DD');

  logCron(`[NOTIFICATION_SERVICE] 🚀 Avvio check scadenze per data target: ${targetDate}`);

  try {
    // 1. Recupero contratti in scadenza tra 7 giorni
    const expiringContracts = await db('contracts')
      .where('status', 'active')
      .whereRaw('DATE(expiry_date) = ?', [targetDate]);

    logCron(`[NOTIFICATION_SERVICE] 🔎 Trovati ${expiringContracts.length} contratti in scadenza il ${targetDate}`);

    for (const contract of expiringContracts) {
      const currentYear = dayjs(targetDate).year();

      // 2. TENTATIVO DI RECLAMO (Scrittura immediata a DB)
      const notificationId = await claimNotification(contract.id, 'contract_renewal', currentYear);
      
      if (!notificationId) {
        // Se null, il record esiste già o un altro processo lo ha appena creato
        stats.skipped++;
        continue;
      }

      // 3. RECUPERO DATI COMPLETI (Solo se abbiamo vinto il claim)
      const fullContract = await getFullContract(contract.id);
      if (!fullContract) {
        logCronError(`[NOTIFICATION_SERVICE] ❌ Impossibile recuperare dettagli per contratto ${contract.id}`);
        stats.failed++;
        continue;
      }

      // Log di controllo per il problema dell'email di fallback
      if (!fullContract.userEmail) {
        logCron(`[NOTIFICATION_SERVICE] ⚠️ WARNING: Contratto ${contract.id} non ha userEmail. Verrà usato il fallback.`);
      }

      logCron(`[NOTIFICATION_SERVICE] 📧 Invio reminder CONTRATTO ID: ${contract.id}`);

      // 4. INVIO EMAIL
      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'contract');
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'contract');

      // 5. AGGIORNAMENTO STATO FINALE
      await updateNotificationStatus(notificationId, sentClient, sentInternal);
      
      if (sentInternal || sentClient) {
        stats.sent++;
      } else {
        stats.failed++;
      }
    }

    // 6. LOGICA SIMILE PER LE ANNUALITÀ (Annuity)
    const expiringAnnuities = await db('contracts')
      .join('annuities', 'contracts.id', 'annuities.contract_id')
      .where('contracts.status', 'active')
      .where('annuities.status', 'pending')
      .whereRaw('DATE(annuities.due_date) = ?', [targetDate])
      .select('annuities.*');

    for (const annuity of expiringAnnuities) {
      const notificationId = await claimNotification(annuity.contract_id, 'annuity_renewal', annuity.year);
      
      if (!notificationId) {
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

      await updateNotificationStatus(notificationId, sentClient, sentInternal);
      
      if (sentInternal || sentClient) {
        stats.sent++;
      } else {
        stats.failed++;
      }
    }

    return stats;

  } catch (error) {
    logCronError('[NOTIFICATION_SERVICE] ❌ Errore critico durante esecuzione job:', error);
    return stats;
  }
};

/**
 * Recupera il contratto con tutte le relazioni necessarie per l'email.
 */
async function getFullContract(contractId: number): Promise<ContractWithRelations | null> {
  try {
    const contract = await db('contracts').where('id', contractId).first();
    if (!contract) return null;

    const owner = await db('owners').where('id', contract.owner_id).first();
    const tenant = await db('tenants').where('id', contract.tenant_id).first();
    const property = await db('properties').where('id', contract.property_id).first();
    
    // Recupera l'email dell'utente gestore per la notifica interna
    const managingUser = await db('users').select('email').where('id', owner.user_id).first();

    return {
      ...contract,
      rent_amount: parseDecimal(contract.rent_amount),
      security_deposit: parseDecimal(contract.security_deposit),
      owner: owner,
      tenant: tenant,
      address: property ? `${property.address}, ${property.city}` : 'Indirizzo non specificato',
      userEmail: managingUser?.email // Se undefined, emailService userà il fallback
    };
  } catch (error) {
    logCronError(`[NOTIFICATION_SERVICE] Errore fetch dati contratto ${contractId}:`, error);
    return null;
  }
}
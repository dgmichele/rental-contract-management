import dayjs from 'dayjs';
import db from '../config/db';
import { 
  NotificationType, 
} from '../types/database';
import { ContractWithRelations } from '../types/api';
import * as emailService from './email.service';
import { logCron, logCronError } from './logger.service';
import { parseDecimal } from '../utils/contract.utils';

export const claimNotification = async (
  contractId: number, 
  type: NotificationType, 
  year: number | null
): Promise<number | null> => {
  try {
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
      logCron(`[NOTIFICATION_SERVICE] 🔒 Notifica creata ID: ${newId} per contratto ${contractId}`);
      return newId;
    }
    return null; 
  } catch (error: any) {
    if (error.code === '40001') return null;
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore claim:`, error);
    return null;
  }
};

export const updateNotificationStatus = async (id: number, sentToClient: boolean, sentToInternal: boolean) => {
  try {
    await db('notifications').where('id', id).update({
      sent_to_client: sentToClient,
      sent_to_internal: sentToInternal,
      sent_at: new Date()
    });
  } catch (error) {
    logCronError(`[NOTIFICATION_SERVICE] ❌ Errore update ${id}:`, error);
  }
};

export const sendExpiringContractsNotifications = async () => {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  const targetDate = dayjs().add(7, 'day').format('YYYY-MM-DD');

  try {
    // 1. CONTRATTI IN SCADENZA (Usiamo end_date come da migration)
    const expiringContracts = await db('contracts')
      .whereRaw('DATE(end_date) = ?', [targetDate]);

    for (const contract of expiringContracts) {
      const notificationId = await claimNotification(contract.id, 'contract_renewal', dayjs(targetDate).year());
      
      if (!notificationId) {
        stats.skipped++;
        continue;
      }

      const fullContract = await getFullContract(contract.id);
      if (!fullContract) { stats.failed++; continue; }

      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'contract');
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'contract');

      await updateNotificationStatus(notificationId, sentClient, sentInternal);
      stats.sent++;
    }

    // 2. ANNUALITÀ IN SCADENZA (Usiamo is_paid = false e due_date)
    const expiringAnnuities = await db('annuities')
      .where('is_paid', false)
      .whereRaw('DATE(due_date) = ?', [targetDate]);

    for (const annuity of expiringAnnuities) {
      const notificationId = await claimNotification(annuity.contract_id, 'annuity_renewal', annuity.year);
      
      if (!notificationId) {
        stats.skipped++;
        continue;
      }

      const fullContract = await getFullContract(annuity.contract_id);
      if (!fullContract) { stats.failed++; continue; }

      const sentInternal = await emailService.sendExpirationReminderInternal(fullContract, 'annuity', annuity.year);
      const sentClient = await emailService.sendExpirationReminderClient(fullContract, 'annuity', annuity.year);

      await updateNotificationStatus(notificationId, sentClient, sentInternal);
      stats.sent++;
    }

    return stats;
  } catch (error) {
    logCronError('[NOTIFICATION_SERVICE] ❌ Errore critico:', error);
    return stats;
  }
};

async function getFullContract(contractId: number): Promise<ContractWithRelations | null> {
  try {
    const contract = await db('contracts').where('id', contractId).first();
    if (!contract) return null;

    const owner = await db('owners').where('id', contract.owner_id).first();
    const tenant = await db('tenants').where('id', contract.tenant_id).first();
    const property = await db('properties').where('id', contract.property_id).first();
    const managingUser = await db('users').select('email').where('id', owner.user_id).first();

    return {
      ...contract,
      // Mapping corretto nomi colonne migration -> Interfaccia Frontend
      rent_amount: parseDecimal(contract.monthly_rent), 
      expiry_date: contract.end_date,
      owner,
      tenant,
      address: contract.address || (property ? `${property.address}, ${property.city}` : 'Indirizzo non specificato'),
      userEmail: managingUser?.email
    };
  } catch (error) {
    return null;
  }
}
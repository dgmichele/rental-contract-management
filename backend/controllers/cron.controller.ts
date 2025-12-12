import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import * as notificationService from '../services/notification.service';
import { logCron } from '../services/logger.service';

/**
 * Trigger manuale del cron job per test.
 * Utile per verificare il funzionamento senza aspettare 24h.
 * 
 * IMPORTANTE: Questo endpoint dovrebbe essere protetto e accessibile solo agli admin.
 * Per ora è protetto solo da autenticazione base (qualsiasi utente loggato).
 * 
 * @route POST /api/cron/trigger-notifications
 * @access Private (richiede JWT)
 */
export const triggerNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    logCron('[CRON_CONTROLLER] 🔧 Trigger manuale job notifiche richiesto da utente: ' + req.userId);

    // Esegue il job di notifica
    const stats = await notificationService.sendExpiringContractsNotifications();

    logCron('[CRON_CONTROLLER] ✅ Job manuale completato', stats);

    res.status(200).json({
      success: true,
      message: 'Job notifiche eseguito con successo',
      data: stats,
    });
  } catch (error) {
    logCron('[CRON_CONTROLLER] ❌ Errore durante trigger manuale', error);
    
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'esecuzione del job notifiche',
    });
  }
};

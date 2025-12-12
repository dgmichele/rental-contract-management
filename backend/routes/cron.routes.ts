import { Router } from 'express';
import * as cronController from '../controllers/cron.controller';

const router = Router();

/**
 * @route   POST /api/cron/trigger-notifications
 * @desc    Trigger manuale del cron job per test
 * @access  Private (richiede JWT - applicato a livello di app in server.ts)
 * @returns Statistiche esecuzione job (processed, sent, skipped, failed)
 * 
 * Esempio response:
 * {
 *   "success": true,
 *   "message": "Job notifiche eseguito con successo",
 *   "data": {
 *     "processed": 5,
 *     "sent": 3,
 *     "skipped": 1,
 *     "failed": 1
 *   }
 * }
 */
router.post('/trigger-notifications', cronController.triggerNotifications as any);

export default router;

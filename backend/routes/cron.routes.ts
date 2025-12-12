import { Router, RequestHandler } from 'express';
import * as cronController from '../controllers/cron.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Proteggi tutte le route cron con autenticazione JWT
router.use(authMiddleware as RequestHandler);

/**
 * @route   POST /api/cron/trigger-notifications
 * @desc    Trigger manuale del cron job per test
 * @access  Private (richiede JWT)
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
router.post('/trigger-notifications', cronController.triggerNotifications as RequestHandler);

export default router;

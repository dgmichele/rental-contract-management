// routes/user.routes.ts
import express from 'express';
import { RequestHandler } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Tutte le rotte qui sono protette
router.use(authMiddleware as RequestHandler);

router.get('/me', userController.getMe as RequestHandler);
router.put('/me/details', userController.updateDetails as RequestHandler);
router.put('/me/password', userController.updatePassword as RequestHandler);

export default router;

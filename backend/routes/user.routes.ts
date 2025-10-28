// routes/user.routes.ts
import express from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Tutte le rotte qui sono protette
router.use(authMiddleware);

router.get('/me', userController.getMe);
router.put('/me/details', userController.updateDetails);
router.put('/me/password', userController.updatePassword);

export default router;

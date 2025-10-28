import { Router, RequestHandler } from 'express';
import * as ownerController from '../controllers/owner.controller';
import {authMiddleware} from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware as RequestHandler);

router.get('/', ownerController.getOwnersController as RequestHandler);
router.get('/:id', ownerController.getOwnerByIdController as RequestHandler);
router.get('/:id/contracts', ownerController.getOwnerContractsController as RequestHandler);
router.post('/', ownerController.createOwnerController as RequestHandler);
router.put('/:id', ownerController.updateOwnerController as RequestHandler);
router.delete('/:id', ownerController.deleteOwnerController as RequestHandler);

export default router;


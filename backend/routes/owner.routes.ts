import { Router, RequestHandler } from 'express';
import * as ownerController from '../controllers/owner.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * Tutte le routes owner richiedono autenticazione.
 * Il middleware auth aggiunge userId e userEmail alla request.
 */
router.use(authMiddleware as RequestHandler);

/**
 * @route   GET /api/owner
 * @desc    Ottieni lista proprietari con paginazione e ricerca
 * @access  Private (richiede JWT)
 * @query   page, limit, search (opzionale)
 */
router.get('/', ownerController.getOwnersController as RequestHandler);

/**
 * @route   GET /api/owner/:id
 * @desc    Ottieni dettagli singolo proprietario
 * @access  Private (richiede JWT)
 */
router.get('/:id', ownerController.getOwnerByIdController as RequestHandler);

/**
 * @route   GET /api/owner/:id/contracts
 * @desc    Ottieni contratti di un proprietario
 * @access  Private (richiede JWT)
 * @query   page, limit
 */
router.get('/:id/contracts', ownerController.getOwnerContractsController as RequestHandler);

/**
 * @route   POST /api/owner
 * @desc    Crea nuovo proprietario
 * @access  Private (richiede JWT)
 * @body    { name, surname, phone, email }
 */
router.post('/', ownerController.createOwnerController as RequestHandler);

/**
 * @route   PUT /api/owner/:id
 * @desc    Aggiorna proprietario esistente
 * @access  Private (richiede JWT)
 * @body    { name?, surname?, phone?, email? }
 */
router.put('/:id', ownerController.updateOwnerController as RequestHandler);

/**
 * @route   DELETE /api/owner/:id
 * @desc    Elimina proprietario (CASCADE contratti)
 * @access  Private (richiede JWT)
 */
router.delete('/:id', ownerController.deleteOwnerController as RequestHandler);

export default router;
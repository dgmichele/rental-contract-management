import { Router, RequestHandler } from 'express';
import * as contractController from '../controllers/contract.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * Tutte le routes contract richiedono autenticazione.
 * Il middleware auth aggiunge userId e userEmail alla request.
 */
router.use(authMiddleware as RequestHandler);

/**
 * @route   GET /api/contract
 * @desc    Ottieni lista contratti con filtri e paginazione
 * @access  Private (richiede JWT)
 * @query   page, limit, ownerId (opzionale), search (opzionale), expiryMonth (opzionale), expiryYear (opzionale)
 * @example GET /api/contract?page=1&limit=12&ownerId=5&search=mario&expiryMonth=10&expiryYear=2025
 */
router.get('/', contractController.getContractsController as RequestHandler);

/**
 * @route   GET /api/contract/:id
 * @desc    Ottieni dettagli completi di un singolo contratto (INCLUDE ANNUITIES - FASE 3)
 * @access  Private (richiede JWT)
 * @returns Contratto con dettagli owner, tenant e annuities
 */
router.get('/:id', contractController.getContractByIdController as RequestHandler);

/**
 * FASE 3: @route   GET /api/contract/:id/annuities
 * @desc    Ottieni solo la timeline delle annuities di un contratto
 * @access  Private (richiede JWT)
 * @returns Array di annuities ordinate per anno
 * @example GET /api/contract/5/annuities
 */
router.get('/:id/annuities', contractController.getContractAnnuitiesController as RequestHandler);

/**
 * @route   POST /api/contract
 * @desc    Crea nuovo contratto (FASE 3: genera automaticamente annuities se NON cedolare_secca)
 * @access  Private (richiede JWT)
 * @body    { owner_id, tenant_id OR tenant_data, start_date, end_date, cedolare_secca, typology, canone_concordato, monthly_rent, last_annuity_paid? }
 * @note    Se tenant_data fornito, crea nuovo tenant; altrimenti usa tenant_id esistente
 */
router.post('/', contractController.createContractController as RequestHandler);

/**
 * @route   PUT /api/contract/:id
 * @desc    Aggiorna contratto esistente
 * @access  Private (richiede JWT)
 * @body    Campi opzionali da aggiornare
 */
router.put('/:id', contractController.updateContractController as RequestHandler);

/**
 * @route   DELETE /api/contract/:id
 * @desc    Elimina contratto (CASCADE annuities)
 * @access  Private (richiede JWT)
 */
router.delete('/:id', contractController.deleteContractController as RequestHandler);

/**
 * ============= ROUTES NON IMPLEMENTATE (FASE 3 SUCCESSIVA) =============
 * 
 * Le seguenti routes verranno implementate nei prossimi step:
 * - PUT /api/contract/:id/renew - Rinnovo contratto
 * - PUT /api/contract/:id/annuity - Aggiorna annualità successiva
 */

export default router;
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
 * ⭐ FASE 3.3: @route   PUT /api/contract/:id/renew
 * @desc    Rinnova contratto esistente (mantiene owner/tenant, aggiorna condizioni)
 * @access  Private (richiede JWT)
 * @body    { start_date, end_date, cedolare_secca, typology, canone_concordato, monthly_rent }
 * @returns Contratto rinnovato con timeline annuities aggiornata
 * * @note    Operazioni eseguite:
 * 1. Elimina vecchie annuities
 * 2. Aggiorna contratto con nuove date e condizioni
 * 3. Setta last_annuity_paid = anno start_date
 * 4. Rigenera annuities (se NON cedolare_secca)
 * * @example PUT /api/contract/5/renew
 * Body: {
 * "start_date": "2028-01-15",
 * "end_date": "2032-01-15",
 * "cedolare_secca": false,
 * "typology": "residenziale",
 * "canone_concordato": true,
 * "monthly_rent": 950.00
 * }
 */
router.put('/:id/renew', contractController.renewContractController as RequestHandler);

/**
 * ⭐ FASE 3.4: @route   PUT /api/contract/:id/annuity
 * @desc    Aggiorna annualità successiva (setta last_annuity_paid e is_paid)
 * @access  Private (richiede JWT)
 * @body    { last_annuity_paid: <anno> }
 * @returns Contratto aggiornato con timeline annuities
 *
 * @note    Operazioni eseguite dal service:
 * 1. Aggiorna contract.last_annuity_paid = <anno>
 * 2. Aggiorna annuity (contract_id, <anno>) -> is_paid = true, paid_at = NOW
 *
 * @example PUT /api/contract/5/annuity
 * Body: { "last_annuity_paid": 2026 }
 */
router.put('/:id/annuity', contractController.updateContractAnnuityController as RequestHandler);

/**
 * @route   DELETE /api/contract/:id
 * @desc    Elimina contratto (CASCADE annuities)
 * @access  Private (richiede JWT)
 */
router.delete('/:id', contractController.deleteContractController as RequestHandler);

export default router;
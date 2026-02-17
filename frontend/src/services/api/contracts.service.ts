import api from './axios.config';
import type {
  CreateContractRequest,
  UpdateContractRequest,
  RenewContractRequest,
  UpdateAnnuityRequest,
  ContractFilters,
  ContractsResponse,
  ContractResponse,
  AnnuitiesResponse,
} from '../../types/contract';

/**
 * Service per gestire le chiamate API relative ai contratti.
 * Tutti gli endpoint richiedono autenticazione (JWT).
 */

/**
 * Ottiene lista contratti con filtri e paginazione
 * GET /api/contract?page=1&limit=12&ownerId=5&search=mario&expiryMonth=10&expiryYear=2025
 */
export const getContracts = async (
  filters?: ContractFilters
): Promise<ContractsResponse> => {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.ownerId) params.append('ownerId', filters.ownerId.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.expiryMonth) params.append('expiryMonth', filters.expiryMonth.toString());
  if (filters?.expiryYear) params.append('expiryYear', filters.expiryYear.toString());

  const { data } = await api.get<ContractsResponse>(
    `/contract?${params.toString()}`
  );
  return data;
};

/**
 * Ottiene dettagli completi di un singolo contratto (include annuities)
 * GET /api/contract/:id
 */
export const getContractById = async (id: number): Promise<ContractResponse> => {
  const { data } = await api.get<ContractResponse>(`/contract/${id}`);
  return data;
};

/**
 * Ottiene solo la timeline delle annuities di un contratto
 * GET /api/contract/:id/annuities
 */
export const getContractAnnuities = async (
  id: number
): Promise<AnnuitiesResponse> => {
  const { data } = await api.get<AnnuitiesResponse>(`/contract/${id}/annuities`);
  return data;
};

/**
 * Crea un nuovo contratto
 * POST /api/contract
 * 
 * Genera automaticamente annuities se NON cedolare_secca
 * Se tenant_data fornito, crea nuovo tenant; altrimenti usa tenant_id esistente
 */
export const createContract = async (
  contractData: CreateContractRequest
): Promise<ContractResponse> => {
  const { data } = await api.post<ContractResponse>('/contract', contractData);
  return data;
};

/**
 * Aggiorna un contratto esistente
 * PUT /api/contract/:id
 * 
 * Supporta anche aggiornamento dati tenant tramite tenant_data
 * Ricalcola automaticamente le due_date delle annualità se vengono modificate le date
 */
export const updateContract = async (
  id: number,
  contractData: UpdateContractRequest
): Promise<ContractResponse> => {
  const { data } = await api.put<ContractResponse>(`/contract/${id}`, contractData);
  return data;
};

/**
 * Rinnova un contratto esistente (mantiene owner/tenant, aggiorna condizioni)
 * PUT /api/contract/:id/renew
 * 
 * Operazioni eseguite:
 * 1. Elimina vecchie annuities
 * 2. Aggiorna contratto con nuove date e condizioni
 * 3. Setta last_annuity_paid = anno start_date
 * 4. Rigenera annuities (se NON cedolare_secca)
 */
export const renewContract = async (
  id: number,
  renewData: RenewContractRequest
): Promise<ContractResponse> => {
  const { data } = await api.put<ContractResponse>(`/contract/${id}/renew`, renewData);
  return data;
};

/**
 * Aggiorna annualità successiva (setta last_annuity_paid e is_paid)
 * PUT /api/contract/:id/annuity
 * 
 * Operazioni eseguite dal backend:
 * 1. Aggiorna contract.last_annuity_paid = <anno>
 * 2. Aggiorna annuity (contract_id, <anno>) -> is_paid = true, paid_at = NOW
 */
export const updateContractAnnuity = async (
  id: number,
  annuityData: UpdateAnnuityRequest
): Promise<ContractResponse> => {
  const { data } = await api.put<ContractResponse>(`/contract/${id}/annuity`, annuityData);
  return data;
};

/**
 * Elimina un contratto (CASCADE annuities)
 * DELETE /api/contract/:id
 */
export const deleteContract = async (id: number): Promise<void> => {
  await api.delete(`/contract/${id}`);
};

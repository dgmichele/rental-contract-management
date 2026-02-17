import type {
  Contract,
  Tenant,
  Annuity,
  ContractWithRelations,
  ContractTypology,
} from './shared';

// ============= REQUEST TYPES =============

/**
 * Dati per creare un nuovo tenant (nested creation)
 */
export interface TenantData {
  name: string;
  surname: string;
  phone?: string;
  email?: string;
}

/**
 * Request per creare un nuovo contratto
 * Accetta tenant_id (esistente) OPPURE tenant_data (nuovo)
 */
export interface CreateContractRequest {
  owner_id: number;
  tenant_id?: number;
  tenant_data?: TenantData;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  cedolare_secca: boolean;
  typology: ContractTypology;
  canone_concordato: boolean;
  monthly_rent: number;
  last_annuity_paid?: number | null;
  address?: string;
}

/**
 * Request per aggiornare un contratto esistente
 * Tutti i campi opzionali
 * Supporta anche aggiornamento dati tenant tramite tenant_data
 */
export interface UpdateContractRequest {
  owner_id?: number;
  tenant_id?: number;
  tenant_data?: Partial<TenantData>;
  start_date?: string;
  end_date?: string;
  cedolare_secca?: boolean;
  typology?: ContractTypology;
  canone_concordato?: boolean;
  monthly_rent?: number;
  last_annuity_paid?: number | null;
  address?: string;
}

/**
 * Request per rinnovare un contratto
 * Tutti i campi obbligatori (nuove condizioni complete)
 * NO tenant_id/owner_id: il rinnovo mantiene sempre gli stessi soggetti
 */
export interface RenewContractRequest {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  cedolare_secca: boolean;
  typology: ContractTypology;
  canone_concordato: boolean;
  monthly_rent: number;
}

/**
 * Request per aggiornare annualità successiva
 */
export interface UpdateAnnuityRequest {
  last_annuity_paid: number; // Anno da marcare come pagato
}

// ============= FILTER TYPES =============

/**
 * Filtri per la lista contratti
 */
export interface ContractFilters {
  page?: number;
  limit?: number;
  ownerId?: number;
  search?: string;
  expiryMonth?: number; // 1-12
  expiryYear?: number; // es. 2025
}

// ============= RESPONSE TYPES =============

/**
 * Response paginata per lista contratti
 */
export interface ContractsResponse {
  success: boolean;
  data: ContractWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response per singolo contratto
 */
export interface ContractResponse {
  success: boolean;
  data: ContractWithRelations;
  message?: string;
}

/**
 * Response per annuities
 */
export interface AnnuitiesResponse {
  success: boolean;
  data: Annuity[];
  message?: string;
}

// ============= EXPORT SHARED TYPES =============

export type {
  Contract,
  Tenant,
  Annuity,
  ContractWithRelations,
  ContractTypology,
};

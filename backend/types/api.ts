// Types per request/response API

import { Contract, Owner, Tenant, Annuity } from './database';

// ============= PAGINATION =============
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ============= GENERIC RESPONSES =============
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

// ============= OWNER ENDPOINTS =============
export interface CreateOwnerBody {
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export interface UpdateOwnerBody {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
}

export interface OwnerWithStats extends Owner {
  totalContracts: number;
  totalMonthlyRent: number;
}

// ============= CONTRACT ENDPOINTS =============

/**
 * ⭐ AGGIORNATO: Aggiunto campo address opzionale
 */
export interface CreateContractBody {
  owner_id: number;
  tenant_id?: number;
  tenant_data?: CreateTenantData;
  start_date: string;
  end_date: string;
  cedolare_secca: boolean;
  typology: 'residenziale' | 'commerciale';
  canone_concordato: boolean;
  monthly_rent: number;
  last_annuity_paid?: number | null;
  address?: string; // ⭐ NUOVO: Indirizzo immobile
}

export interface CreateTenantData {
  name: string;
  surname: string;
  phone: string;
  email: string;
}

/**
 * ⭐ AGGIORNATO: Aggiunto campo address opzionale
 */
export interface UpdateContractBody {
  owner_id?: number;
  tenant_id?: number;
  tenant_data?: UpdateTenantData;
  start_date?: string;
  end_date?: string;
  cedolare_secca?: boolean;
  typology?: 'residenziale' | 'commerciale';
  canone_concordato?: boolean;
  monthly_rent?: number;
  last_annuity_paid?: number | null;
  address?: string; // ⭐ NUOVO: Indirizzo immobile
}

export interface UpdateTenantData {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
}

/**
 * Body per rinnovo contratto.
 * NOTA: address NON è modificabile nel rinnovo (mantiene l'immobile originale)
 */
export interface RenewContractBody {
  start_date: string;
  end_date: string;
  cedolare_secca: boolean;
  typology: 'residenziale' | 'commerciale';
  canone_concordato: boolean;
  monthly_rent: number;
}

export interface RenewAnnuityBody {
  last_annuity_paid: number;
}

// Contract con relazioni popolate
export interface ContractWithRelations extends Contract {
  owner: Owner;
  tenant: Tenant;
  annuities?: Annuity[];
}

// ============= QUERY PARAMS =============
export interface GetOwnersQuery extends PaginationParams {
  search?: string;
}

export interface GetContractsQuery extends PaginationParams {
  ownerId?: number;
  search?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface GetExpiringContractsQuery extends PaginationParams {
  period: 'current' | 'next';
}

// ============= DASHBOARD =============
export interface DashboardStats {
  totalContracts: number;
  totalOwners: number;
  currentMonthExpiriesCount: number;
  nextMonthExpiriesCount: number;
  totalMonthlyRent: number;
}

export interface ExpiringItem {
  contract: ContractWithRelations;
  expiryType: 'contract' | 'annuity';
  expiryDate: string;
  annuityYear?: number;
}

export interface DashboardStatsResponse {
  totalOwners: number;
  totalContracts: number;
  totalMonthlyRent: number;
  expiringContractsCurrentMonth: number;
  expiringContractsNextMonth: number;
}
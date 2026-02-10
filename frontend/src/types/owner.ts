import type { Owner as SharedOwner, Contract } from './shared';

export type Owner = SharedOwner;

export interface CreateOwnerRequest {
  name: string;
  surname: string;
  phone?: string;
  email: string;
}

export interface UpdateOwnerRequest {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
}

export interface OwnerStats {
  total_contracts: number;
  total_monthly_rent: number;
}

export interface OwnerWithStats extends Owner {
  stats: OwnerStats;
}

export interface OwnerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OwnersResponse {
  success: boolean;
  data: Owner[];
  pagination: OwnerPagination;
}

export interface SingleOwnerResponse {
  success: boolean;
  data: OwnerWithStats;
  message?: string;
}

export interface OwnerMutationResponse {
  success: boolean;
  data: Owner;
  message?: string;
}

export interface OwnerContractsResponse {
  success: boolean;
  data: Contract[];
  pagination: OwnerPagination;
}

import type { ContractWithRelations } from './shared';
import type { PaginatedResponse, PaginationParams } from './api';

export interface DashboardStats {
  totalOwners: number;
  totalContracts: number;
  totalMonthlyRent: number;
  expiringContractsCurrentMonth: number; // Renamed to match backend response/service
  expiringContractsNextMonth: number; // Renamed to match backend response/service
}

export interface ExpiringItem {
  contract: ContractWithRelations;
  expiryType: 'contract' | 'annuity';
  expiryDate: string;
  annuityYear?: number;
}

export interface DashboardStatsResponse extends DashboardStats {}

export interface GetExpiringContractsQuery extends PaginationParams {
    period: 'current' | 'next';
}

export type ExpiringContractsResponse = PaginatedResponse<ExpiringItem>;

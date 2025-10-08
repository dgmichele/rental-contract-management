// Types condivisibili con il frontend (senza dettagli sensibili DB)

import { ContractTypology } from './database';

export interface UserProfile {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface OwnerData {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export interface TenantData {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export interface ContractData {
  id: number;
  owner_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  cedolare_secca: boolean;
  typology: ContractTypology;
  canone_concordato: boolean;
  monthly_rent: number;
  last_annuity_paid: number | null;
}

export interface AnnuityData {
  id: number;
  contract_id: number;
  year: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
}

export interface ContractWithDetails extends ContractData {
  owner: OwnerData;
  tenant: TenantData;
  annuities?: AnnuityData[];
}

// Questi types possono essere copiati identici nel frontend
// per type-safety nelle chiamate API e nello state management
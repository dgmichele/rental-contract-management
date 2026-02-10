export type ContractTypology = 'residenziale' | 'commerciale';

export interface Owner {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: number;
  owner_id: number;
  tenant_id: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  cedolare_secca: boolean;
  typology: ContractTypology;
  canone_concordato: boolean;
  monthly_rent: number;
  last_annuity_paid: number | null;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Annuity {
  id: number;
  contract_id: number;
  year: number;
  due_date: string; // YYYY-MM-DD
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractWithRelations extends Contract {
  owner: Owner;
  tenant: Tenant;
  annuities?: Annuity[];
}

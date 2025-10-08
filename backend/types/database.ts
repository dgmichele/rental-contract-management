// Types che rispecchiano esattamente lo schema PostgreSQL

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Owner {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export type ContractTypology = 'residenziale' | 'commerciale';

export interface Contract {
  id: number;
  owner_id: number;
  tenant_id: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string;
  cedolare_secca: boolean;
  typology: ContractTypology;
  canone_concordato: boolean;
  monthly_rent: number; // Decimal in DB, number in TS
  last_annuity_paid: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Annuity {
  id: number;
  contract_id: number;
  year: number;
  due_date: string; // YYYY-MM-DD format
  is_paid: boolean;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export type NotificationType = 'contract_renewal' | 'annuity_renewal';

export interface Notification {
  id: number;
  contract_id: number;
  type: NotificationType;
  year: number | null;
  sent_to_client: boolean;
  sent_to_internal: boolean;
  sent_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  created_at: Date;
}

export interface BlacklistedToken {
  id: number;
  token: string;
  blacklisted_at: Date;
}

// Utility type: Omit campi auto-generati per operazioni INSERT
export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type NewOwner = Omit<Owner, 'id' | 'created_at' | 'updated_at'>;
export type NewTenant = Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
export type NewContract = Omit<Contract, 'id' | 'created_at' | 'updated_at'>;
export type NewAnnuity = Omit<Annuity, 'id' | 'created_at' | 'updated_at'>;
export type NewPasswordResetToken = Omit<PasswordResetToken, 'id' | 'created_at'>;
export type NewNotification = Omit<Notification, 'id'>;
export type NewRefreshToken = Omit<RefreshToken, 'id' | 'created_at'>;
export type NewBlacklistedToken = Omit<BlacklistedToken, 'id' | 'blacklisted_at'>;

// Utility type: Per operazioni UPDATE (tutti campi opzionali eccetto id)
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at'>>;
export type UpdateOwner = Partial<Omit<Owner, 'id' | 'user_id' | 'created_at'>>;
export type UpdateTenant = Partial<Omit<Tenant, 'id' | 'user_id' | 'created_at'>>;
export type UpdateContract = Partial<Omit<Contract, 'id' | 'created_at'>>;
export type UpdateAnnuity = Partial<Omit<Annuity, 'id' | 'contract_id' | 'created_at'>>;
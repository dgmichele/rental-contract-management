import dayjs from 'dayjs';
import { Contract } from '../types/database';

/**
 * Parsa un valore decimale (stringa da DB) in numero.
 * @param value Valore stringa o number
 */
export const parseDecimal = (value: any): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
};

/**
 * Formatta un record piatto della query (join contracts/owners/tenants) 
 * in un oggetto Contract strutturato con owner e tenant nested.
 * 
 * @param row Riga piatta dal database
 * @returns Oggetto contratto formattato
 */
export const formatContractRow = (row: any) => {
  if (!row) return null;

  return {
    id: row.id,
    owner_id: row.owner_id,
    tenant_id: row.tenant_id,
    start_date: dayjs(row.start_date).format('YYYY-MM-DD'),
    end_date: dayjs(row.end_date).format('YYYY-MM-DD'),
    cedolare_secca: row.cedolare_secca,
    typology: row.typology,
    canone_concordato: row.canone_concordato,
    monthly_rent: parseDecimal(row.monthly_rent),
    last_annuity_paid: row.last_annuity_paid,
    address: row.address,
    created_at: row.created_at,
    updated_at: row.updated_at,
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      surname: row.owner_surname,
      email: row.owner_email,
      phone: row.owner_phone,
    },
    tenant: {
      id: row.tenant_id,
      name: row.tenant_name,
      surname: row.tenant_surname,
      email: row.tenant_email,
      phone: row.tenant_phone,
    },
  };
};

/**
 * Formatta un record di annualità assicurando il formato stringa per la data.
 * @param annuity Riga DB
 */
export const formatAnnuityRow = (annuity: any) => {
  if (!annuity) return null;
  
  return {
    id: annuity.id,
    contract_id: annuity.contract_id,
    year: annuity.year,
    due_date: dayjs(annuity.due_date).format('YYYY-MM-DD'),
    is_paid: annuity.is_paid,
    paid_at: annuity.paid_at,
    created_at: annuity.created_at,
    updated_at: annuity.updated_at,
  };
};

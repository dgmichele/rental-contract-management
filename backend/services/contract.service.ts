import db from '../config/db';
import { Contract, NewContract, UpdateContract, Owner, Tenant, NewTenant } from '../types/database';
import { CreateContractBody, UpdateContractBody } from '../types/api';
import AppError from '../utils/AppError';
import dayjs from 'dayjs';
import * as annuityService from './annuity.service';

/**
 * Crea un nuovo contratto.
 * Gestisce due scenari:
 * 1. Tenant esistente (tenant_id fornito)
 * 2. Tenant nuovo (tenant_data fornito)
 * 
 * FASE 3: Genera automaticamente annuities dopo creazione contratto (se non cedolare_secca)
 * 
 * @param userId - ID utente autenticato
 * @param data - Dati contratto da creare
 * @returns Contratto creato con dettagli owner e tenant
 */
export const createContract = async (
  userId: number,
  data: CreateContractBody
): Promise<Contract> => {
  console.log('[CONTRACT_SERVICE] Creazione contratto per userId:', userId);

  try {
    return await db.transaction(async (trx) => {
      // 1. Verifica che l'owner appartenga all'utente autenticato
      const owner = await trx<Owner>('owners')
        .where({ id: data.owner_id, user_id: userId })
        .first();

      if (!owner) {
        console.log('[CONTRACT_SERVICE] Owner non trovato o non autorizzato:', data.owner_id);
        throw new AppError('Proprietario non trovato o accesso negato', 404);
      }

      console.log('[CONTRACT_SERVICE] Owner verificato, id:', owner.id);

      let tenantId: number;

      // 2. Gestione tenant (esistente o nuovo)
      if (data.tenant_id) {
        // Scenario 1: Tenant esistente
        console.log('[CONTRACT_SERVICE] Uso tenant esistente, id:', data.tenant_id);

        // Verifica che il tenant appartenga allo stesso user_id dell'owner
        const tenant = await trx<Tenant>('tenants')
          .where({ id: data.tenant_id, user_id: owner.user_id })
          .first();

        if (!tenant) {
          console.log('[CONTRACT_SERVICE] Tenant non trovato o non autorizzato:', data.tenant_id);
          throw new AppError('Inquilino non trovato o accesso negato', 404);
        }

        tenantId = tenant.id;
      } else if (data.tenant_data) {
        // Scenario 2: Crea nuovo tenant
        console.log('[CONTRACT_SERVICE] Creazione nuovo tenant');

        const newTenant: NewTenant = {
          name: data.tenant_data.name,
          surname: data.tenant_data.surname,
          phone: data.tenant_data.phone || '',
          email: data.tenant_data.email || '',
          user_id: owner.user_id, // Deriva user_id dall'owner
        };

        const [createdTenant] = await trx<Tenant>('tenants')
          .insert(newTenant)
          .returning('*');

        tenantId = createdTenant.id;
        console.log('[CONTRACT_SERVICE] Tenant creato, id:', tenantId);
      } else {
        throw new AppError('Devi fornire tenant_id o tenant_data', 400);
      }

      // 3. Validazione date
      const startDate = dayjs(data.start_date);
      const endDate = dayjs(data.end_date);

      if (!startDate.isValid() || !endDate.isValid()) {
        throw new AppError('Date non valide', 400);
      }

      if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
        throw new AppError('La data di fine deve essere successiva alla data di inizio', 400);
      }

      // 4. Creazione contratto
      const newContract: NewContract = {
        owner_id: data.owner_id,
        tenant_id: tenantId,
        start_date: data.start_date,
        end_date: data.end_date,
        cedolare_secca: data.cedolare_secca,
        typology: data.typology,
        canone_concordato: data.canone_concordato,
        monthly_rent: data.monthly_rent,
        last_annuity_paid: data.last_annuity_paid || null,
      };

      const [contract] = await trx<Contract>('contracts')
        .insert(newContract)
        .returning('*');

      console.log('[CONTRACT_SERVICE] Contratto creato, id:', contract.id);

      // 5. FASE 3: Genera annuities automaticamente (se NON cedolare_secca)
      if (!contract.cedolare_secca) {
        console.log('[CONTRACT_SERVICE] Generazione annuities per contratto:', contract.id);
        
        try {
          // Usa la funzione esistente di annuity.service
          await annuityService.generateAnnuitiesForContract(contract.id, trx);
          console.log('[CONTRACT_SERVICE] ✅ Annuities generate con successo');
        } catch (error) {
          console.error('[CONTRACT_SERVICE] ❌ Errore generazione annuities:', error);
          // Rollback automatico della transaction in caso di errore
          throw new AppError('Errore durante la generazione delle annualità', 500);
        }
      } else {
        console.log('[CONTRACT_SERVICE] Contratto in cedolare_secca, nessuna annuity generata');
      }

      return contract;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[CONTRACT_SERVICE] Errore creazione contratto:', error);
    throw new AppError('Errore durante la creazione del contratto', 500);
  }
};

/**
 * Ottiene lista contratti con filtri e paginazione.
 * Include join con owner e tenant per mostrare dettagli completi.
 * 
 * @param userId - ID utente autenticato
 * @param page - Numero pagina
 * @param limit - Elementi per pagina
 * @param filters - Filtri opzionali (ownerId, search, expiryMonth, expiryYear)
 * @returns Lista contratti paginata con dettagli
 */
export const getContracts = async (
  userId: number,
  page: number,
  limit: number,
  filters?: {
    ownerId?: number;
    search?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }
): Promise<{ data: any[]; total: number }> => {
  console.log('[CONTRACT_SERVICE] Get contracts per userId:', userId, 'filters:', filters);

  try {
    // Query base: join con owners, tenants
    // Filtro per user_id tramite owners (solo contratti dell'utente autenticato)
    const query = db<Contract>('contracts')
      .join('owners', 'contracts.owner_id', 'owners.id')
      .join('tenants', 'contracts.tenant_id', 'tenants.id')
      .where('owners.user_id', userId)
      .select(
        'contracts.*',
        'owners.name as owner_name',
        'owners.surname as owner_surname',
        'owners.email as owner_email',
        'owners.phone as owner_phone',
        'tenants.name as tenant_name',
        'tenants.surname as tenant_surname',
        'tenants.email as tenant_email',
        'tenants.phone as tenant_phone'
      );

    // Applica filtri opzionali
    if (filters?.ownerId) {
      query.andWhere('contracts.owner_id', filters.ownerId);
      console.log('[CONTRACT_SERVICE] Filtro ownerId:', filters.ownerId);
    }

    if (filters?.search) {
      // Cerca per nome/cognome owner O tenant
      query.andWhere(function () {
        this.where('owners.name', 'ilike', `%${filters.search}%`)
          .orWhere('owners.surname', 'ilike', `%${filters.search}%`)
          .orWhere('tenants.name', 'ilike', `%${filters.search}%`)
          .orWhere('tenants.surname', 'ilike', `%${filters.search}%`);
      });
      console.log('[CONTRACT_SERVICE] Filtro search:', filters.search);
    }

    if (filters?.expiryMonth && filters?.expiryYear) {
      // Filtra per mese/anno di scadenza (end_date)
      const startOfMonth = dayjs()
        .year(filters.expiryYear)
        .month(filters.expiryMonth - 1)
        .startOf('month')
        .format('YYYY-MM-DD');

      const endOfMonth = dayjs()
        .year(filters.expiryYear)
        .month(filters.expiryMonth - 1)
        .endOf('month')
        .format('YYYY-MM-DD');

      query.andWhereBetween('contracts.end_date', [startOfMonth, endOfMonth]);
      console.log('[CONTRACT_SERVICE] Filtro expiry:', filters.expiryMonth, filters.expiryYear);
    }

    // Count totale (senza paginazione)
    const countResult = await query.clone().clearSelect().count<{ count: string }>('* as count').first();
    const total = parseInt(countResult?.count || '0', 10);

    // Dati paginati
    const contracts = await query
      .clone()
      .offset((page - 1) * limit)
      .limit(limit)
      .orderBy('contracts.end_date', 'asc'); // Ordina per scadenza

    // Formatta response con owner e tenant nested
    const formattedContracts = contracts.map((row: any) => ({
      id: row.id,
      owner_id: row.owner_id,
      tenant_id: row.tenant_id,
      start_date: row.start_date,
      end_date: row.end_date,
      cedolare_secca: row.cedolare_secca,
      typology: row.typology,
      canone_concordato: row.canone_concordato,
      monthly_rent: parseFloat(row.monthly_rent), // Decimal to number
      last_annuity_paid: row.last_annuity_paid,
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
    }));

    console.log('[CONTRACT_SERVICE] Contratti trovati:', formattedContracts.length, 'di', total);

    return { data: formattedContracts, total };
  } catch (error) {
    console.error('[CONTRACT_SERVICE] Errore get contracts:', error);
    throw new AppError('Errore nel recupero dei contratti', 500);
  }
};

/**
 * Ottiene dettagli completi di un singolo contratto.
 * Include owner, tenant e annuities (FASE 3).
 * 
 * @param userId - ID utente autenticato
 * @param contractId - ID contratto
 * @returns Contratto con dettagli owner, tenant e annuities
 */
export const getContractById = async (
  userId: number,
  contractId: number
): Promise<any> => {
  console.log('[CONTRACT_SERVICE] Get contractById:', contractId, 'userId:', userId);

  try {
    const contract = await db<Contract>('contracts')
      .join('owners', 'contracts.owner_id', 'owners.id')
      .join('tenants', 'contracts.tenant_id', 'tenants.id')
      .where('contracts.id', contractId)
      .andWhere('owners.user_id', userId) // Verifica ownership
      .select(
        'contracts.*',
        'owners.id as owner_id',
        'owners.name as owner_name',
        'owners.surname as owner_surname',
        'owners.email as owner_email',
        'owners.phone as owner_phone',
        'tenants.id as tenant_id',
        'tenants.name as tenant_name',
        'tenants.surname as tenant_surname',
        'tenants.email as tenant_email',
        'tenants.phone as tenant_phone'
      )
      .first();

    if (!contract) {
      console.log('[CONTRACT_SERVICE] Contratto non trovato o accesso negato:', contractId);
      throw new AppError('Contratto non trovato o accesso negato', 404);
    }

    // FASE 3: Recupera annuities associate al contratto
    const annuities = await db('annuities')
      .where({ contract_id: contractId })
      .orderBy('year', 'asc');

    console.log('[CONTRACT_SERVICE] Annuities trovate:', annuities.length);

    // Formatta annuities (converti due_date in formato stringa YYYY-MM-DD)
    const formattedAnnuities = annuities.map(annuity => ({
      id: annuity.id,
      contract_id: annuity.contract_id,
      year: annuity.year,
      due_date: dayjs(annuity.due_date).format('YYYY-MM-DD'),
      is_paid: annuity.is_paid,
      paid_at: annuity.paid_at,
      created_at: annuity.created_at,
      updated_at: annuity.updated_at,
    }));

    // Formatta response
    const formattedContract = {
      id: contract.id,
      owner_id: contract.owner_id,
      tenant_id: contract.tenant_id,
      start_date: contract.start_date,
      end_date: contract.end_date,
      cedolare_secca: contract.cedolare_secca,
      typology: contract.typology,
      canone_concordato: contract.canone_concordato,
      monthly_rent: parseFloat(contract.monthly_rent as any),
      last_annuity_paid: contract.last_annuity_paid,
      created_at: contract.created_at,
      updated_at: contract.updated_at,
      owner: {
        id: contract.owner_id,
        name: contract.owner_name,
        surname: contract.owner_surname,
        email: contract.owner_email,
        phone: contract.owner_phone,
      },
      tenant: {
        id: contract.tenant_id,
        name: contract.tenant_name,
        surname: contract.tenant_surname,
        email: contract.tenant_email,
        phone: contract.tenant_phone,
      },
      annuities: formattedAnnuities, // FASE 3: Includi annuities nella response
    };

    console.log('[CONTRACT_SERVICE] Contratto trovato:', formattedContract.id);
    return formattedContract;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[CONTRACT_SERVICE] Errore get contract by id:', error);
    throw new AppError('Errore nel recupero del contratto', 500);
  }
};

/**
 * Aggiorna un contratto esistente.
 * Verifica ownership tramite owner_id.
 * 
 * @param userId - ID utente autenticato
 * @param contractId - ID contratto da aggiornare
 * @param data - Dati da aggiornare
 * @returns Contratto aggiornato
 */
export const updateContract = async (
  userId: number,
  contractId: number,
  data: UpdateContractBody
): Promise<Contract> => {
  console.log('[CONTRACT_SERVICE] Update contract:', contractId, 'userId:', userId);

  try {
    return await db.transaction(async (trx) => {
      // 1. Verifica che il contratto esista e appartenga all'utente
      const existingContract = await trx<Contract>('contracts')
        .join('owners', 'contracts.owner_id', 'owners.id')
        .where('contracts.id', contractId)
        .andWhere('owners.user_id', userId)
        .select('contracts.*')
        .first();

      if (!existingContract) {
        console.log('[CONTRACT_SERVICE] Contratto non trovato o accesso negato:', contractId);
        throw new AppError('Contratto non trovato o accesso negato', 404);
      }

      // 2. Validazione date se fornite
      if (data.start_date && data.end_date) {
        const startDate = dayjs(data.start_date);
        const endDate = dayjs(data.end_date);

        if (!startDate.isValid() || !endDate.isValid()) {
          throw new AppError('Date non valide', 400);
        }

        if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
          throw new AppError('La data di fine deve essere successiva alla data di inizio', 400);
        }
      }

      // 3. Prepara dati update (solo campi forniti)
      const updateData: Partial<Contract> = {
        ...data,
        updated_at: new Date(),
      };

      // 4. Aggiorna contratto
      const [updatedContract] = await trx<Contract>('contracts')
        .where({ id: contractId })
        .update(updateData)
        .returning('*');

      console.log('[CONTRACT_SERVICE] Contratto aggiornato:', updatedContract.id);
      return updatedContract;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[CONTRACT_SERVICE] Errore update contract:', error);
    throw new AppError('Errore durante l\'aggiornamento del contratto', 500);
  }
};

/**
 * Elimina un contratto.
 * Verifica ownership tramite owner_id.
 * Annuities vengono eliminate in CASCADE (FK constraint).
 * 
 * @param userId - ID utente autenticato
 * @param contractId - ID contratto da eliminare
 */
export const deleteContract = async (
  userId: number,
  contractId: number
): Promise<void> => {
  console.log('[CONTRACT_SERVICE] Delete contract:', contractId, 'userId:', userId);

  try {
    return await db.transaction(async (trx) => {
      // 1. Verifica che il contratto esista e appartenga all'utente
      const contract = await trx<Contract>('contracts')
        .join('owners', 'contracts.owner_id', 'owners.id')
        .where('contracts.id', contractId)
        .andWhere('owners.user_id', userId)
        .select('contracts.*')
        .first();

      if (!contract) {
        console.log('[CONTRACT_SERVICE] Contratto non trovato o accesso negato:', contractId);
        throw new AppError('Contratto non trovato o accesso negato', 404);
      }

      // 2. Elimina contratto (CASCADE elimina annuities automaticamente)
      await trx<Contract>('contracts')
        .where({ id: contractId })
        .del();

      console.log('[CONTRACT_SERVICE] Contratto eliminato:', contractId);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[CONTRACT_SERVICE] Errore delete contract:', error);
    throw new AppError('Errore durante l\'eliminazione del contratto', 500);
  }
};
import db from '../config/db';
import { Contract, NewContract, UpdateContract, Owner, Tenant, NewTenant } from '../types/database';
import { CreateContractBody, UpdateContractBody, RenewContractBody } from '../types/api';
import AppError from '../utils/AppError';
import dayjs from 'dayjs';
import * as annuityService from './annuity.service';
import { formatContractRow, formatAnnuityRow, parseDecimal } from '../utils/contract.utils';

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
        address: data.address,
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

      return formatContractRow(contract) as Contract;
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
      // Cerca per nome/cognome owner O tenant (scatta solo dall'inizio del nome/cognome)
      query.andWhere(function () {
        this.where('owners.name', 'ilike', `${filters.search}%`)
          .orWhere('owners.surname', 'ilike', `${filters.search}%`)
          .orWhere(db.raw("owners.name || ' ' || owners.surname"), 'ilike', `${filters.search}%`)
          .orWhere(db.raw("owners.surname || ' ' || owners.name"), 'ilike', `${filters.search}%`)
          .orWhere('tenants.name', 'ilike', `${filters.search}%`)
          .orWhere('tenants.surname', 'ilike', `${filters.search}%`)
          .orWhere(db.raw("tenants.name || ' ' || tenants.surname"), 'ilike', `${filters.search}%`)
          .orWhere(db.raw("tenants.surname || ' ' || tenants.name"), 'ilike', `${filters.search}%`);
      });
      console.log('[CONTRACT_SERVICE] Filtro search (anchored):', filters.search);
    }

    // Filter logic
    if (filters?.expiryYear && filters?.expiryMonth) {
      // Both year and month provided
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
    } else if (filters?.expiryYear) {
      // Only year provided
      const startOfYear = dayjs().year(filters.expiryYear).startOf('year').format('YYYY-MM-DD');
      const endOfYear = dayjs().year(filters.expiryYear).endOf('year').format('YYYY-MM-DD');
      
      query.andWhereBetween('contracts.end_date', [startOfYear, endOfYear]);
    } else if (filters?.expiryMonth) {
      // Only month provided (any year)
      query.whereRaw('EXTRACT(MONTH FROM contracts.end_date) = ?', [filters.expiryMonth]);
    }

    if (filters?.expiryMonth || filters?.expiryYear) {
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

    // Formatta response tramite helper centralizzato
    const formattedContracts = contracts.map((row: any) => formatContractRow(row));

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

    // Idrata contratto con helper centralizzato (include owner e tenant)
    const formattedContract = formatContractRow(contract) as any;
    
    // Aggiunge le annualità formattate
    formattedContract.annuities = annuities.map(a => formatAnnuityRow(a));

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
 * ⭐ AGGIORNATO: Supporta anche aggiornamento dati tenant tramite tenant_data.
 * ⭐ NUOVO: Ricalcola automaticamente le due_date delle annualità se vengono modificate le date del contratto.
 * 
 * @param userId - ID utente autenticato
 * @param contractId - ID contratto da aggiornare
 * @param data - Dati da aggiornare (include opzionale tenant_data)
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

      // ⭐ 2. NUOVO: Se tenant_data è fornito, aggiorna i dati del tenant
      if (data.tenant_data) {
        console.log('[CONTRACT_SERVICE] Aggiornamento dati tenant, tenantId:', existingContract.tenant_id);
        
        // Verifica che il tenant appartenga allo stesso utente (sicurezza extra)
        const tenant = await trx<Tenant>('tenants')
          .join('owners', 'tenants.user_id', 'owners.user_id')
          .where('tenants.id', existingContract.tenant_id)
          .andWhere('owners.user_id', userId)
          .select('tenants.*')
          .first();

        if (!tenant) {
          console.log('[CONTRACT_SERVICE] Tenant non trovato o accesso negato');
          throw new AppError('Inquilino non trovato o accesso negato', 404);
        }

        // Prepara dati update tenant (solo campi forniti)
        const tenantUpdateData: Partial<Tenant> = {
          ...(data.tenant_data.name && { name: data.tenant_data.name }),
          ...(data.tenant_data.surname && { surname: data.tenant_data.surname }),
          ...(data.tenant_data.phone !== undefined && { phone: data.tenant_data.phone }),
          ...(data.tenant_data.email !== undefined && { email: data.tenant_data.email }),
          updated_at: new Date(),
        };

        // Aggiorna tenant
        await trx<Tenant>('tenants')
          .where({ id: existingContract.tenant_id })
          .update(tenantUpdateData);

        console.log('[CONTRACT_SERVICE] ✅ Dati tenant aggiornati');
      }

      // 3. Validazione date se fornite
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

      // 4. Prepara dati update contratto (solo campi forniti, ESCLUSO tenant_data)
      const { tenant_data, ...contractData } = data; // Rimuovi tenant_data dai dati contratto
      
      const updateData: Partial<Contract> = {
        ...contractData,
        updated_at: new Date(),
      };

      // 5. Aggiorna contratto
      const [updatedContract] = await trx<Contract>('contracts')
        .where({ id: contractId })
        .update(updateData)
        .returning('*');

      console.log('[CONTRACT_SERVICE] ✅ Contratto aggiornato:', updatedContract.id);

      // ⭐ 6. NUOVO: Ricalcola annuities se sono state modificate le date del contratto
      const datesChanged = data.start_date || data.end_date;
      
      if (datesChanged) {
        console.log('[CONTRACT_SERVICE] Date modificate, ricalcolo annuities...');
        await annuityService.recalculateAnnuityDueDates(contractId, trx);
        console.log('[CONTRACT_SERVICE] ✅ Annuities ricalcolate');
      }

      // ⭐ 7. NUOVO: Sincronizza is_paid delle annuities se last_annuity_paid è stato modificato
      const newLastAnnuity = data.last_annuity_paid;
      const oldLastAnnuity = existingContract.last_annuity_paid;
      console.log('[CONTRACT_SERVICE] last_annuity_paid check - old:', oldLastAnnuity, '(type:', typeof oldLastAnnuity, ') new:', newLastAnnuity, '(type:', typeof newLastAnnuity, ')');
      
      if (newLastAnnuity !== undefined && Number(newLastAnnuity) !== Number(oldLastAnnuity)) {
        console.log('[CONTRACT_SERVICE] last_annuity_paid modificato, sincronizzazione is_paid...');
        await annuityService.syncAnnuityPaidStatus(contractId, trx);
        console.log('[CONTRACT_SERVICE] ✅ is_paid annuities sincronizzato');
      }

      return formatContractRow(updatedContract) as Contract;
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

/**
 * ⭐ FASE 3.3: Rinnova un contratto esistente.
 * 
 * Operazioni eseguite in TRANSACTION:
 * 1. Verifica ownership del contratto
 * 2. Elimina tutte le vecchie annuities
 * 3. Aggiorna il contratto con nuove date e condizioni
 * 4. Setta last_annuity_paid = anno della nuova start_date
 * 5. Rigenera annuities in base alle nuove date (se NON cedolare_secca)
 * 
 * Logica last_annuity_paid:
 * - Quando si rinnova un contratto, l'anno del rinnovo coincide con la prima annualità pagata
 * - Esempio: rinnovo 2028-01-15 → last_annuity_paid = 2028
 * - Questo perché il pagamento dell'annualità è implicito nel rinnovo stesso
 * 
 * @param userId - ID utente autenticato
 * @param contractId - ID contratto da rinnovare
 * @param data - Nuove condizioni contrattuali (date, cedolare_secca, canone, ecc.)
 * @returns Contratto rinnovato con annuities aggiornate
 * 
 * @example
 * const renewed = await renewContract(userId, contractId, {
 *   start_date: "2028-01-15",
 *   end_date: "2032-01-15",
 *   cedolare_secca: false,
 *   typology: "residenziale",
 *   canone_concordato: true,
 *   monthly_rent: 950.00
 * });
 */
export const renewContract = async (
  userId: number,
  contractId: number,
  data: RenewContractBody
): Promise<any> => {
  console.log('[CONTRACT_SERVICE] 🔄 Rinnovo contratto:', contractId, 'userId:', userId);

  try {
    return await db.transaction(async (trx) => {
      // 1. Verifica ownership e recupera contratto esistente
      const existingContract = await trx<Contract>('contracts')
        .join('owners', 'contracts.owner_id', 'owners.id')
        .where('contracts.id', contractId)
        .andWhere('owners.user_id', userId)
        .select('contracts.*')
        .first();

      if (!existingContract) {
        console.log('[CONTRACT_SERVICE] ❌ Contratto non trovato o accesso negato:', contractId);
        throw new AppError('Contratto non trovato o accesso negato', 404);
      }

      console.log('[CONTRACT_SERVICE] ✅ Contratto trovato, owner_id:', existingContract.owner_id, 'tenant_id:', existingContract.tenant_id);

      // 2. Validazione date (flessibile: permette gap tra vecchio end_date e nuovo start_date)
      const startDate = dayjs(data.start_date);
      const endDate = dayjs(data.end_date);

      if (!startDate.isValid() || !endDate.isValid()) {
        throw new AppError('Date non valide', 400);
      }

      if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
        throw new AppError('La data di fine deve essere successiva alla data di inizio', 400);
      }

      console.log('[CONTRACT_SERVICE] ✅ Date validate:', data.start_date, '→', data.end_date);

      // 3. Calcola last_annuity_paid: solo se NON è cedolare secca
      // Se è cedolare secca, lo mettiamo a null per pulizia dati
      const lastAnnuityPaid = data.cedolare_secca ? null : startDate.year();
      console.log('[CONTRACT_SERVICE] 📅 last_annuity_paid settato a:', lastAnnuityPaid);

      // 4. Elimina vecchie annuities (pulizia completa)
      const deletedCount = await trx('annuities')
        .where({ contract_id: contractId })
        .del();

      console.log('[CONTRACT_SERVICE] 🗑️  Annuities vecchie eliminate:', deletedCount);

      // 5. Aggiorna contratto con nuove condizioni
      const updateData: Partial<Contract> = {
        start_date: data.start_date,
        end_date: data.end_date,
        cedolare_secca: data.cedolare_secca,
        typology: data.typology,
        canone_concordato: data.canone_concordato,
        monthly_rent: data.monthly_rent,
        last_annuity_paid: lastAnnuityPaid, // ⭐ Anno del rinnovo
        updated_at: new Date(),
      };

      await trx<Contract>('contracts')
        .where({ id: contractId })
        .update(updateData);

      console.log('[CONTRACT_SERVICE] ✅ Contratto aggiornato con nuove condizioni');

      // 6. Rigenera annuities (se NON cedolare_secca)
      let newAnnuities: any[] = [];

      if (!data.cedolare_secca) {
        console.log('[CONTRACT_SERVICE] 🔄 Generazione nuove annuities...');

        try {
          // Usa annuity.service per generare annuities (rispetta logica esistente)
          await annuityService.generateAnnuitiesForContract(contractId, trx);
          
          // Recupera le annuities appena generate per includerle nella response
          newAnnuities = await trx('annuities')
            .where({ contract_id: contractId })
            .orderBy('year', 'asc');

          console.log('[CONTRACT_SERVICE] ✅ Nuove annuities generate:', newAnnuities.length);
        } catch (error) {
          console.error('[CONTRACT_SERVICE] ❌ Errore generazione nuove annuities:', error);
          throw new AppError('Errore durante la generazione delle nuove annualità', 500);
        }
      } else {
        console.log('[CONTRACT_SERVICE] ℹ️  Contratto in cedolare_secca, nessuna annuity generata');
      }

      // 7. Recupera dettagli completi per response (owner, tenant, annuities)
      const contractDetails = await trx<Contract>('contracts')
        .join('owners', 'contracts.owner_id', 'owners.id')
        .join('tenants', 'contracts.tenant_id', 'tenants.id')
        .where('contracts.id', contractId)
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
        )
        .first();

      // Formatta contratto con helper e aggiunge annualità
      const response = formatContractRow(contractDetails) as any;
      response.annuities = newAnnuities.map(a => formatAnnuityRow(a));

      console.log('[CONTRACT_SERVICE] ✅ Contratto rinnovato con successo. Dati inviati al client.');

      return response;
    });
  } catch (error) {
    console.error(`[CONTRACT_SERVICE] ❌ Errore durante il rinnovo del contratto ${contractId}:`, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Errore del server durante il rinnovo del contratto', 500);
  }
};
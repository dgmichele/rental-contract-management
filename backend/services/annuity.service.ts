import db from '../config/db';
import { Contract, Annuity, NewAnnuity } from '../types/database';
import AppError from '../utils/AppError';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Knex } from 'knex';
import { formatAnnuityRow } from '../utils/contract.utils';

dayjs.extend(utc);

/**
 * Genera le annualities per un contratto NON in cedolare secca.
 * Logica:
 * - Se cedolare_secca: true → return []
 * - Calcola anni intermedi tra start_date e end_date (ESCLUSI primo e ultimo)
 * - Per ogni anno: crea annuity con due_date = end_date (stesso giorno/mese) nell'anno dell'annualità
 * - is_paid basato su last_annuity_paid del contratto
 * 
 * Esempi:
 * - start 2023-11-01 / end 2029-10-31: genera [2024, 2025, 2026, 2027, 2028]
 *   con due_date = XX-10-31 per ogni anno
 * - 2025-2026: genera [] (nessun anno intermedio)
 * - 2025-2030: genera [2026, 2027, 2028, 2029]
 * 
 * @param contractId - ID del contratto
 * @param trx - Transaction Knex opzionale (per uso in altre transaction)
 * @returns Array di annuities create (vuoto se cedolare secca)
 * @throws AppError 404 se contratto non trovato
 * @throws AppError 500 per errori generici
 */
export const generateAnnuitiesForContract = async (
  contractId: number,
  trx?: Knex.Transaction
): Promise<Annuity[]> => {
  console.log('[ANNUITY_SERVICE] Generazione annuities per contractId:', contractId);

  try {
    // Funzione helper per eseguire la logica
    const executeGeneration = async (transaction: Knex.Transaction) => {
      // 1. Recupera il contratto
      const contract = await transaction<Contract>('contracts')
        .where({ id: contractId })
        .first();

      if (!contract) {
        console.log('[ANNUITY_SERVICE] Contratto non trovato:', contractId);
        throw new AppError('Contratto non trovato', 404);
      }

      console.log('[ANNUITY_SERVICE] Contratto trovato:', {
        id: contract.id,
        cedolare_secca: contract.cedolare_secca,
        start_date: contract.start_date,
        end_date: contract.end_date,
        last_annuity_paid: contract.last_annuity_paid,
      });

      // 2. Se cedolare secca, non genera annuities
      if (contract.cedolare_secca) {
        console.log('[ANNUITY_SERVICE] Contratto in cedolare secca, nessuna annuity generata');
        return [];
      }

      // 3. Calcola anni intermedi
      const startYear = dayjs(contract.start_date).year();
      const endYear = dayjs(contract.end_date).year();

      // Array di anni intermedi (esclusi primo e ultimo)
      const intermediateYears: number[] = [];
      for (let year = startYear + 1; year < endYear; year++) {
        intermediateYears.push(year);
      }

      console.log('[ANNUITY_SERVICE] Anni intermedi calcolati:', intermediateYears);

      // Se non ci sono anni intermedi, ritorna array vuoto
      if (intermediateYears.length === 0) {
        console.log('[ANNUITY_SERVICE] Nessun anno intermedio, nessuna annuity generata');
        return [];
      }

      // 4. Crea annuities per ogni anno intermedio
      const annuitiesToInsert: NewAnnuity[] = intermediateYears.map((year) => {
        // Calcola due_date: stesso giorno e mese della end_date, ma anno dell'annualità
        // (es. end_date 31/10/2029 → due_date 31/10/2026 per l'anno 2026)
        const dueDate = dayjs(contract.end_date)
          .year(year)
          .format('YYYY-MM-DD');

        // Determina is_paid basandosi su last_annuity_paid
        const isPaid = contract.last_annuity_paid 
          ? year <= contract.last_annuity_paid 
          : false;

        return {
          contract_id: contractId,
          year,
          due_date: dueDate,
          is_paid: isPaid,
          paid_at: isPaid ? new Date() : null, // Se già pagata, segna ora come paid_at
        };
      });

      console.log('[ANNUITY_SERVICE] Annuities da inserire:', annuitiesToInsert.length);

      // 5. Inserimento atomico in transaction
      const createdAnnuities = await transaction<Annuity>('annuities')
        .insert(annuitiesToInsert)
        .returning('*');

      // FIX: Formattiamo due_date come stringa YYYY-MM-DD per evitare problemi di fuso orario
      const formattedAnnuities = createdAnnuities.map(annuity => ({
        ...annuity,
        due_date: dayjs(annuity.due_date).format('YYYY-MM-DD'),
      }));

      console.log('[ANNUITY_SERVICE] ✅ Annuities create con successo:', formattedAnnuities.length);

      return formattedAnnuities;
    };

    // Se è stata passata una transaction, usala; altrimenti creane una nuova
    if (trx) {
      // Usa la transaction esistente (chiamata da createContract)
      return await executeGeneration(trx);
    } else {
      // Crea una nuova transaction (chiamata standalone)
      return await db.transaction(async (newTrx) => {
        return await executeGeneration(newTrx);
      });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[ANNUITY_SERVICE] Errore generazione annuities:', error);
    throw new AppError('Errore durante la generazione delle annualità', 500);
  }
};

/**
 * Recupera la timeline completa delle annuities per un contratto.
 * Utile per visualizzare lo stato pagamenti nella pagina contratto singolo.
 * 
 * @param contractId - ID del contratto
 * @returns Array di annuities ordinate per anno
 * @throws AppError 404 se contratto non trovato
 */
export const getAnnuitiesByContract = async (
  userId: number,
  contractId: number
): Promise<Annuity[]> => {
  console.log('[ANNUITY_SERVICE] Get annuities per contractId:', contractId, 'userId:', userId);

  try {
    // 1. Verifica che il contratto esista e appartenga all'utente
    const contract = await db<Contract>('contracts')
      .join('owners', 'contracts.owner_id', 'owners.id')
      .where('contracts.id', contractId)
      .andWhere('owners.user_id', userId)
      .select('contracts.*')
      .first();

    if (!contract) {
      console.log('[ANNUITY_SERVICE] Contratto non trovato o accesso negato:', contractId, 'userId:', userId);
      throw new AppError('Contratto non trovato o accesso negato', 404);
    }

    // Recupera tutte le annuities ordinate per anno
    const annuities = await db<Annuity>('annuities')
      .where({ contract_id: contractId })
      .orderBy('year', 'asc');
    
    // FIX: Formattiamo tramite helper per coerenza
    const formattedAnnuities = annuities.map(annuity => formatAnnuityRow(annuity)) as Annuity[];

    console.log('[ANNUITY_SERVICE] Annuities trovate:', formattedAnnuities.length);

    return formattedAnnuities;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[ANNUITY_SERVICE] Errore recupero annuities:', error);
    throw new AppError('Errore nel recupero delle annualità', 500);
  }
};

/**
 * Aggiorna un'annuity specifica come pagata.
 * Marca is_paid = true, paid_at = NOW(), e aggiorna last_annuity_paid del contratto.
 * 
 * Questo viene chiamato quando l'utente conferma il pagamento di un'annualità
 * dalla modalità "Gestisci annualità" nella pagina contratto singolo.
 * 
 * @param contractId - ID del contratto
 * @param year - Anno dell'annuity da marcare come pagata
 * @returns Annuity aggiornata
 * @throws AppError 404 se annuity non trovata
 * @throws AppError 400 se annuity già pagata
 */
export const updateAnnuityPaid = async (
  userId: number,
  contractId: number,
  year: number
): Promise<Annuity> => {
  console.log('[ANNUITY_SERVICE] Update annuity paid:', { contractId, year, userId });

  try {
    return await db.transaction(async (trx) => {
      // 1. Verifica ownership del contratto (sicurezza!)
      const contract = await trx<Contract>('contracts')
        .join('owners', 'contracts.owner_id', 'owners.id')
        .where('contracts.id', contractId)
        .andWhere('owners.user_id', userId)
        .select('contracts.*')
        .first();

      if (!contract) {
        console.log('[ANNUITY_SERVICE] Contratto non trovato o accesso negato:', contractId);
        throw new AppError('Contratto non trovato o accesso negato', 404);
      }

      // 2. Trova l'annuity associata
      const annuity = await trx<Annuity>('annuities')
        .where({ contract_id: contractId, year })
        .first();

      if (!annuity) {
        console.log('[ANNUITY_SERVICE] Annuity non trovata:', { contractId, year });
        throw new AppError('Annualità non trovata', 404);
      }

      // 2. Verifica che non sia già pagata
      if (annuity.is_paid) {
        console.log('[ANNUITY_SERVICE] Annuity già pagata:', annuity.id);
        throw new AppError('Annualità già marcata come pagata', 400);
      }

      // 3. Marca annuity come pagata
      const [updatedAnnuity] = await trx<Annuity>('annuities')
        .where({ id: annuity.id })
        .update({
          is_paid: true,
          paid_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      console.log('[ANNUITY_SERVICE] Annuity marcata come pagata:', updatedAnnuity.id);

      // 5. Aggiorna last_annuity_paid del contratto
      const currentLastAnnuity = contract.last_annuity_paid || 0;
      
      if (year > currentLastAnnuity) {
        await trx<Contract>('contracts')
          .where({ id: contractId })
          .update({
            last_annuity_paid: year,
            updated_at: new Date(),
          });

        console.log('[ANNUITY_SERVICE] Contratto last_annuity_paid aggiornato:', year);
      } else {
        console.log('[ANNUITY_SERVICE] last_annuity_paid non aggiornato (anno non maggiore)');
      }

      // 6. Formatta tramite helper
      return formatAnnuityRow(updatedAnnuity) as Annuity;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[ANNUITY_SERVICE] Errore update annuity:', error);
    throw new AppError('Errore durante l\'aggiornamento dell\'annualità', 500);
  }
};

/**
 * Ricalcola le due_date delle annualità esistenti quando viene modificata la end_date del contratto.
 * Questa funzione viene chiamata quando si aggiorna un contratto per mantenere la coerenza dei dati.
 * 
 * Logica:
 * - Recupera il contratto aggiornato
 * - Se cedolare_secca: elimina tutte le annuities (non dovrebbero esistere)
 * - Calcola i nuovi anni intermedi basati su start_date e end_date aggiornate
 * - Elimina annuities per anni che non sono più intermedi
 * - Aggiorna le due_date delle annuities esistenti usando giorno/mese di end_date
 * - Crea nuove annuities per anni intermedi mancanti
 * 
 * @param contractId - ID del contratto
 * @param trx - Transaction Knex opzionale (per uso in altre transaction)
 * @returns Array di annuities aggiornate/create
 * @throws AppError 404 se contratto non trovato
 * @throws AppError 500 per errori generici
 */
export const recalculateAnnuityDueDates = async (
  contractId: number,
  trx?: Knex.Transaction
): Promise<Annuity[]> => {
  console.log('[ANNUITY_SERVICE] Ricalcolo due_date annuities per contractId:', contractId);

  try {
    // Funzione helper per eseguire la logica
    const executeRecalculation = async (transaction: Knex.Transaction) => {
      // 1. Recupera il contratto aggiornato
      const contract = await transaction<Contract>('contracts')
        .where({ id: contractId })
        .first();

      if (!contract) {
        console.log('[ANNUITY_SERVICE] Contratto non trovato:', contractId);
        throw new AppError('Contratto non trovato', 404);
      }

      console.log('[ANNUITY_SERVICE] Contratto trovato:', {
        id: contract.id,
        cedolare_secca: contract.cedolare_secca,
        start_date: contract.start_date,
        end_date: contract.end_date,
      });

      // 2. Se cedolare secca, elimina tutte le annuities (non dovrebbero esistere)
      if (contract.cedolare_secca) {
        await transaction<Annuity>('annuities')
          .where({ contract_id: contractId })
          .delete();
        
        console.log('[ANNUITY_SERVICE] Contratto in cedolare secca, annuities eliminate');
        return [];
      }

      // 3. Calcola i nuovi anni intermedi
      const startYear = dayjs(contract.start_date).year();
      const endYear = dayjs(contract.end_date).year();

      const newIntermediateYears: number[] = [];
      for (let year = startYear + 1; year < endYear; year++) {
        newIntermediateYears.push(year);
      }

      console.log('[ANNUITY_SERVICE] Nuovi anni intermedi calcolati:', newIntermediateYears);

      // 4. Recupera annuities esistenti
      const existingAnnuities = await transaction<Annuity>('annuities')
        .where({ contract_id: contractId })
        .orderBy('year', 'asc');

      console.log('[ANNUITY_SERVICE] Annuities esistenti:', existingAnnuities.length);

      // 5. Identifica annuities da eliminare (anni non più intermedi)
      const yearsToDelete = existingAnnuities
        .filter(a => !newIntermediateYears.includes(a.year))
        .map(a => a.year);

      if (yearsToDelete.length > 0) {
        await transaction<Annuity>('annuities')
          .where({ contract_id: contractId })
          .whereIn('year', yearsToDelete)
          .delete();

        console.log('[ANNUITY_SERVICE] Annuities eliminate per anni non più intermedi:', yearsToDelete);
      }

      // 6. Aggiorna le due_date delle annuities esistenti che rimangono valide
      // Usa end_date come riferimento per giorno/mese (nuova logica)
      const yearsToUpdate = existingAnnuities
        .filter(a => newIntermediateYears.includes(a.year))
        .map(a => a.year);

      for (const year of yearsToUpdate) {
        const newDueDate = dayjs(contract.end_date)
          .year(year)
          .format('YYYY-MM-DD');

        await transaction<Annuity>('annuities')
          .where({ contract_id: contractId, year })
          .update({
            due_date: newDueDate,
            updated_at: new Date(),
          });

        console.log(`[ANNUITY_SERVICE] Annuity ${year} aggiornata con nuova due_date:`, newDueDate);
      }

      // 7. Crea nuove annuities per anni intermedi mancanti
      const existingYears = existingAnnuities.map(a => a.year);
      const yearsToCreate = newIntermediateYears.filter(year => !existingYears.includes(year));

      if (yearsToCreate.length > 0) {
        const annuitiesToInsert: NewAnnuity[] = yearsToCreate.map((year) => {
          // Usa end_date come riferimento per giorno/mese (nuova logica)
          const dueDate = dayjs(contract.end_date)
            .year(year)
            .format('YYYY-MM-DD');

          // Determina is_paid basandosi su last_annuity_paid
          const isPaid = contract.last_annuity_paid 
            ? year <= contract.last_annuity_paid 
            : false;

          return {
            contract_id: contractId,
            year,
            due_date: dueDate,
            is_paid: isPaid,
            paid_at: isPaid ? new Date() : null,
          };
        });

        await transaction<Annuity>('annuities')
          .insert(annuitiesToInsert);

        console.log('[ANNUITY_SERVICE] Nuove annuities create per anni mancanti:', yearsToCreate);
      }

      // 8. Recupera tutte le annuities finali
      const finalAnnuities = await transaction<Annuity>('annuities')
        .where({ contract_id: contractId })
        .orderBy('year', 'asc');

      // Formatta le date
      const formattedAnnuities = finalAnnuities.map(annuity => ({
        ...annuity,
        due_date: dayjs(annuity.due_date).format('YYYY-MM-DD'),
      }));

      console.log('[ANNUITY_SERVICE] ✅ Ricalcolo completato, annuities finali:', formattedAnnuities.length);

      return formattedAnnuities;
    };

    // Se è stata passata una transaction, usala; altrimenti creane una nuova
    if (trx) {
      return await executeRecalculation(trx);
    } else {
      return await db.transaction(async (newTrx) => {
        return await executeRecalculation(newTrx);
      });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[ANNUITY_SERVICE] Errore ricalcolo annuities:', error);
    throw new AppError('Errore durante il ricalcolo delle annualità', 500);
  }
};

/**
 * Sincronizza lo stato is_paid di tutte le annuities di un contratto
 * in base al valore corrente di last_annuity_paid.
 * 
 * Logica:
 * - Annuities con year <= last_annuity_paid → is_paid = true
 * - Annuities con year > last_annuity_paid → is_paid = false, paid_at = null
 * 
 * Viene chiamata quando last_annuity_paid viene modificato in edit mode
 * per riallineare la timeline.
 * 
 * @param contractId - ID del contratto
 * @param trx - Transaction Knex opzionale
 */
export const syncAnnuityPaidStatus = async (
  contractId: number,
  trx?: Knex.Transaction
): Promise<void> => {
  console.log('[ANNUITY_SERVICE] Sync is_paid status per contractId:', contractId);

  try {
    const executSync = async (transaction: Knex.Transaction) => {
      // 1. Recupera il contratto
      const contract = await transaction<Contract>('contracts')
        .where({ id: contractId })
        .first();

      if (!contract) {
        throw new AppError('Contratto non trovato', 404);
      }

      if (contract.cedolare_secca) {
        console.log('[ANNUITY_SERVICE] Contratto in cedolare secca, skip sync');
        return;
      }

      const lastPaid = contract.last_annuity_paid || 0;
      console.log('[ANNUITY_SERVICE] last_annuity_paid:', lastPaid);

      // 2. Marca come pagate le annuities con anno <= last_annuity_paid
      const paidCount = await transaction<Annuity>('annuities')
        .where({ contract_id: contractId })
        .andWhere('year', '<=', lastPaid)
        .andWhere('is_paid', false)
        .update({
          is_paid: true,
          paid_at: new Date(),
          updated_at: new Date(),
        });

      console.log('[ANNUITY_SERVICE] Annuities marcate come pagate:', paidCount);

      // 3. Marca come NON pagate le annuities con anno > last_annuity_paid
      const unpaidCount = await transaction<Annuity>('annuities')
        .where({ contract_id: contractId })
        .andWhere('year', '>', lastPaid)
        .andWhere('is_paid', true)
        .update({
          is_paid: false,
          paid_at: null,
          updated_at: new Date(),
        });

      console.log('[ANNUITY_SERVICE] Annuities marcate come non pagate:', unpaidCount);
      console.log('[ANNUITY_SERVICE] ✅ Sync is_paid completato');
    };

    if (trx) {
      await executSync(trx);
    } else {
      await db.transaction(async (newTrx) => {
        await executSync(newTrx);
      });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[ANNUITY_SERVICE] Errore sync is_paid:', error);
    throw new AppError('Errore durante la sincronizzazione dello stato annualità', 500);
  }
};

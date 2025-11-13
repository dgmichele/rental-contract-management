import db from '../config/db';
import { Contract, Annuity, NewAnnuity } from '../types/database';
import AppError from '../utils/AppError';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Knex } from 'knex';

dayjs.extend(utc);

/**
 * Genera le annualities per un contratto NON in cedolare secca.
 * Logica:
 * - Se cedolare_secca: true → return []
 * - Calcola anni intermedi tra start_date e end_date (ESCLUSI primo e ultimo)
 * - Per ogni anno: crea annuity con two_date = start_date + N anni
 * - is_paid basato su last_annuity_paid del contratto
 * 
 * Esempi:
 * - 2025-2028: genera [2026, 2027]
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
        // Calcola due_date: stesso giorno e mese dello start_date, ma anno diverso
        const dueDate = dayjs(contract.start_date)
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
  contractId: number
): Promise<Annuity[]> => {
  console.log('[ANNUITY_SERVICE] Get annuities per contractId:', contractId);

  try {
    // Verifica che il contratto esista
    const contract = await db<Contract>('contracts')
      .where({ id: contractId })
      .first();

    if (!contract) {
      console.log('[ANNUITY_SERVICE] Contratto non trovato:', contractId);
      throw new AppError('Contratto non trovato', 404);
    }

    // Recupera tutte le annuities ordinate per anno
    const annuities = await db<Annuity>('annuities')
      .where({ contract_id: contractId })
      .orderBy('year', 'asc');
    
    // FIX: Formattiamo due_date come stringa YYYY-MM-DD per coerenza
    const formattedAnnuities = annuities.map(annuity => ({
      ...annuity,
      due_date: dayjs(annuity.due_date).format('YYYY-MM-DD'),
    }));

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
  contractId: number,
  year: number
): Promise<Annuity> => {
  console.log('[ANNUITY_SERVICE] Update annuity paid:', { contractId, year });

  try {
    return await db.transaction(async (trx) => {
      // 1. Trova l'annuity
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

      // 4. Aggiorna last_annuity_paid del contratto
      // IMPORTANTE: Aggiorniamo SOLO se il nuovo anno è maggiore del precedente last_annuity_paid
      const contract = await trx<Contract>('contracts')
        .where({ id: contractId })
        .first();

      if (!contract) {
        throw new AppError('Contratto non trovato', 404);
      }

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

      // FIX: Formattiamo due_date per coerenza prima di restituirla
      const finalAnnuity = {
        ...updatedAnnuity,
        due_date: dayjs(updatedAnnuity.due_date).format('YYYY-MM-DD'),
      };

      return finalAnnuity;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('[ANNUITY_SERVICE] Errore update annuity:', error);
    throw new AppError('Errore durante l\'aggiornamento dell\'annualità', 500);
  }
};
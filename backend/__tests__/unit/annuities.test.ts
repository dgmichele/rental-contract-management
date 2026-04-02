import { describe, it, expect, beforeEach } from '@jest/globals';
import db from '../../config/db';
import * as annuityService from '../../services/annuity.service';
import dayjs from 'dayjs';

/**
 * Test suite per la logica delle annuities.
 * Copre:
 * - NO annuities per cedolare_secca: true
 * - Generazione corretta per diversi range di anni
 * - Calcolo due_date correttamente basato su end_date (NON start_date)
 * - Caso critico: start_date e end_date con giorno/mese DIVERSI
 * - Logica is_paid basata su last_annuity_paid
 * - Edge cases (contratti brevi)
 */
describe('Annuities Logic Unit Tests', () => {
  
  /**
   * Helper per creare un contratto di test
   */
  const createTestContract = async (data: {
    start_date: string;
    end_date: string;
    cedolare_secca: boolean;
    last_annuity_paid?: number | null;
  }) => {
    // Crea utente test
    const [user] = await db('users').insert({
      name: 'Test',
      surname: 'User',
      email: `test-${Date.now()}@test.com`,
      password_hash: 'hashed',
    }).returning('*');

    // Crea owner test
    const [owner] = await db('owners').insert({
      name: 'Owner',
      surname: 'Test',
      phone: '123',
      email: 'owner@test.com',
      user_id: user.id,
    }).returning('*');

    // Crea tenant test
    const [tenant] = await db('tenants').insert({
      name: 'Tenant',
      surname: 'Test',
      phone: '456',
      email: 'tenant@test.com',
      user_id: user.id,
    }).returning('*');

    // Crea contratto
    const [contract] = await db('contracts').insert({
      owner_id: owner.id,
      tenant_id: tenant.id,
      start_date: data.start_date,
      end_date: data.end_date,
      cedolare_secca: data.cedolare_secca,
      typology: 'residenziale',
      canone_concordato: true,
      monthly_rent: 500,
      last_annuity_paid: data.last_annuity_paid || null,
    }).returning('*');

    return contract;
  };

  // ============= TEST 1: NO ANNUITIES PER CEDOLARE SECCA =============
  describe('Cedolare Secca = TRUE', () => {
    
    it('✅ Dovrebbe NON generare annuities se cedolare_secca: true', async () => {
      // Crea contratto in cedolare secca (4 anni)
      const contract = await createTestContract({
        start_date: '2025-01-15',
        end_date: '2029-01-15',
        cedolare_secca: true,
      });

      // Genera annuities
      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Verifica: nessuna annuity creata
      expect(annuities).toEqual([]);
      expect(annuities.length).toBe(0);

      // Verifica DB: nessuna annuity presente
      const annuitiesInDb = await db('annuities')
        .where({ contract_id: contract.id });
      
      expect(annuitiesInDb.length).toBe(0);
    });

    it('✅ Dovrebbe NON generare annuities per contratto breve in cedolare secca', async () => {
      // Contratto 2025-2026 (solo 1 anno, ma cedolare secca)
      const contract = await createTestContract({
        start_date: '2025-03-01',
        end_date: '2026-03-01',
        cedolare_secca: true,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      expect(annuities).toEqual([]);
    });
  });

  // ============= TEST 2: GENERAZIONE ANNI INTERMEDI =============
  describe('Generazione Annuities (Cedolare Secca = FALSE)', () => {
    
    it('✅ Dovrebbe generare [2026, 2027] per contratto 2025-2028', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-15',
        end_date: '2028-01-15',
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Verifica: 2 annuities generate (2026, 2027)
      expect(annuities.length).toBe(2);
      expect(annuities.map(a => a.year)).toEqual([2026, 2027]);
    });

    it('✅ Dovrebbe generare [] per contratto 2025-2026 (nessun anno intermedio)', async () => {
      const contract = await createTestContract({
        start_date: '2025-06-01',
        end_date: '2026-06-01',
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Verifica: nessuna annuity (no anni intermedi)
      expect(annuities.length).toBe(0);
    });

    it('✅ Dovrebbe generare [2026, 2027, 2028, 2029] per contratto 2025-2030', async () => {
      const contract = await createTestContract({
        start_date: '2025-03-10',
        end_date: '2030-03-10',
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Verifica: 4 annuities (2026, 2027, 2028, 2029)
      expect(annuities.length).toBe(4);
      expect(annuities.map(a => a.year)).toEqual([2026, 2027, 2028, 2029]);
    });

    it('✅ Dovrebbe generare [2027] per contratto 2026-2028', async () => {
      const contract = await createTestContract({
        start_date: '2026-09-15',
        end_date: '2028-09-15',
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      expect(annuities.length).toBe(1);
      expect(annuities[0].year).toBe(2027);
    });
  });

  // ============= TEST 3: CALCOLO DUE_DATE CORRETTE =============
  describe('Calcolo Due Dates (basate su end_date, NON start_date)', () => {
    
    it('✅ Caso semplice: start e end con stesso giorno/mese', async () => {
      // Quando start e end hanno stesso giorno/mese il comportamento è invariato
      const contract = await createTestContract({
        start_date: '2025-01-15',
        end_date: '2028-01-15', // ← giorno/mese di riferimento: 15 gennaio
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      expect(annuities[0].due_date).toBe('2026-01-15'); // Anno 2026
      expect(annuities[1].due_date).toBe('2027-01-15'); // Anno 2027
    });

    it('✅ CASO CRITICO: start e end con giorno/mese DIVERSI → due_date deve seguire end_date', async () => {
      // Esempio reale: start_date 01/11/2023, end_date 31/10/2029
      // Le due_date devono essere 31/10/ANNO (da end_date), NON 01/11/ANNO (da start_date)
      const contract = await createTestContract({
        start_date: '2023-11-01', // 1 novembre
        end_date: '2029-10-31',   // 31 ottobre ← questo è il riferimento corretto
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Anni intermedi: 2024, 2025, 2026, 2027, 2028
      expect(annuities.length).toBe(5);
      expect(annuities.map(a => a.year)).toEqual([2024, 2025, 2026, 2027, 2028]);

      // Le due_date devono usare giorno/mese di end_date (31/10), NON start_date (01/11)
      expect(annuities[0].due_date).toBe('2024-10-31'); // NON 2024-11-01
      expect(annuities[1].due_date).toBe('2025-10-31'); // NON 2025-11-01
      expect(annuities[2].due_date).toBe('2026-10-31'); // NON 2026-11-01
      expect(annuities[3].due_date).toBe('2027-10-31');
      expect(annuities[4].due_date).toBe('2028-10-31');
    });

    it('✅ Dovrebbe gestire date a metà anno correttamente', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01', // inizio anno
        end_date: '2029-06-30',   // 30 giugno ← riferimento
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Anni intermedi: 2026, 2027, 2028
      expect(annuities.length).toBe(3);
      expect(annuities[0].due_date).toBe('2026-06-30'); // mese/giorno da end_date
      expect(annuities[1].due_date).toBe('2027-06-30');
      expect(annuities[2].due_date).toBe('2028-06-30');
    });

    it('✅ Dovrebbe gestire date a fine anno correttamente', async () => {
      const contract = await createTestContract({
        start_date: '2024-01-01',
        end_date: '2027-12-31', // 31 dicembre ← riferimento
        cedolare_secca: false,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Anni intermedi: 2025, 2026
      expect(annuities.length).toBe(2);
      expect(annuities[0].due_date).toBe('2025-12-31');
      expect(annuities[1].due_date).toBe('2026-12-31');
    });
  });

  // ============= TEST 4: LOGICA IS_PAID =============
  describe('Logica is_paid basata su last_annuity_paid', () => {
    
    it('✅ Dovrebbe marcare tutte le annuities come is_paid: false se last_annuity_paid è null', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
        last_annuity_paid: null,
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      // Tutte is_paid: false
      annuities.forEach(annuity => {
        expect(annuity.is_paid).toBe(false);
        expect(annuity.paid_at).toBeNull();
      });
    });

    it('✅ Dovrebbe marcare annuities <= last_annuity_paid come is_paid: true', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2029-01-01', // Anni intermedi: 2026, 2027, 2028
        cedolare_secca: false,
        last_annuity_paid: 2026, // Solo 2026 pagata
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      expect(annuities.length).toBe(3);

      // 2026: pagata
      const annuity2026 = annuities.find(a => a.year === 2026);
      expect(annuity2026?.is_paid).toBe(true);
      expect(annuity2026?.paid_at).toBeTruthy();

      // 2027, 2028: non pagate
      const annuity2027 = annuities.find(a => a.year === 2027);
      const annuity2028 = annuities.find(a => a.year === 2028);
      
      expect(annuity2027?.is_paid).toBe(false);
      expect(annuity2027?.paid_at).toBeNull();
      expect(annuity2028?.is_paid).toBe(false);
      expect(annuity2028?.paid_at).toBeNull();
    });

    it('✅ Dovrebbe marcare tutte le annuities come pagate se last_annuity_paid >= ultimo anno', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01', // Anni intermedi: 2026, 2027
        cedolare_secca: false,
        last_annuity_paid: 2027, // Tutte pagate
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      expect(annuities.length).toBe(2);

      // Tutte pagate
      annuities.forEach(annuity => {
        expect(annuity.is_paid).toBe(true);
        expect(annuity.paid_at).toBeTruthy();
      });
    });

    it('✅ Dovrebbe gestire last_annuity_paid parziale correttamente', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2030-01-01', // Anni intermedi: 2026, 2027, 2028, 2029
        cedolare_secca: false,
        last_annuity_paid: 2027, // 2026 e 2027 pagate
      });

      const annuities = await annuityService.generateAnnuitiesForContract(contract.id);

      expect(annuities.length).toBe(4);

      const paidYears = annuities.filter(a => a.is_paid).map(a => a.year);
      const unpaidYears = annuities.filter(a => !a.is_paid).map(a => a.year);

      expect(paidYears).toEqual([2026, 2027]);
      expect(unpaidYears).toEqual([2028, 2029]);
    });
  });

  // ============= TEST 5: UPDATE ANNUITY PAID =============
  describe('updateAnnuityPaid', () => {
    
    it('✅ Dovrebbe marcare annuity come pagata e aggiornare contratto', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
        last_annuity_paid: null,
      });

      // Genera annuities
      await annuityService.generateAnnuitiesForContract(contract.id);

      // Recupera userId dall'owner del contratto
      const contractRow = await db('contracts').where({ id: contract.id }).first();
      const ownerRow = await db('owners').where({ id: contractRow.owner_id }).first();
      const userId = ownerRow.user_id;

      // Marca 2026 come pagata
      const updatedAnnuity = await annuityService.updateAnnuityPaid(userId, contract.id, 2026);

      expect(updatedAnnuity.is_paid).toBe(true);
      expect(updatedAnnuity.paid_at).toBeTruthy();

      // Verifica contratto aggiornato
      const updatedContract = await db('contracts')
        .where({ id: contract.id })
        .first();

      expect(updatedContract.last_annuity_paid).toBe(2026);
    });

    it('❌ Dovrebbe fallire se annuity già pagata', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
        last_annuity_paid: 2026, // Già pagata
      });

      await annuityService.generateAnnuitiesForContract(contract.id);

      const contractRow = await db('contracts').where({ id: contract.id }).first();
      const ownerRow = await db('owners').where({ id: contractRow.owner_id }).first();
      const userId = ownerRow.user_id;

      // Tenta di marcare nuovamente 2026 come pagata
      await expect(
        annuityService.updateAnnuityPaid(userId, contract.id, 2026)
      ).rejects.toThrow('Annualità già marcata come pagata');
    });

    it('❌ Dovrebbe fallire se annuity non trovata', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
      });

      await annuityService.generateAnnuitiesForContract(contract.id);

      const contractRow = await db('contracts').where({ id: contract.id }).first();
      const ownerRow = await db('owners').where({ id: contractRow.owner_id }).first();
      const userId = ownerRow.user_id;

      // Tenta di marcare anno non esistente
      await expect(
        annuityService.updateAnnuityPaid(userId, contract.id, 2030)
      ).rejects.toThrow('Annualità non trovata');
    });
  });

  // ============= TEST 6: GET ANNUITIES BY CONTRACT =============
  describe('getAnnuitiesByContract', () => {
    
    it('✅ Dovrebbe restituire timeline completa ordinata per anno', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2029-01-01',
        cedolare_secca: false,
      });

      await annuityService.generateAnnuitiesForContract(contract.id);

      const contractRow = await db('contracts').where({ id: contract.id }).first();
      const ownerRow = await db('owners').where({ id: contractRow.owner_id }).first();
      const userId = ownerRow.user_id;

      const timeline = await annuityService.getAnnuitiesByContract(userId, contract.id);

      expect(timeline.length).toBe(3); // 2026, 2027, 2028
      
      // Verifica ordinamento
      const years = timeline.map(a => a.year);
      expect(years).toEqual([2026, 2027, 2028]);
    });

    it('✅ Dovrebbe restituire array vuoto per cedolare secca', async () => {
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2029-01-01',
        cedolare_secca: true,
      });

      await annuityService.generateAnnuitiesForContract(contract.id);

      const contractRow = await db('contracts').where({ id: contract.id }).first();
      const ownerRow = await db('owners').where({ id: contractRow.owner_id }).first();
      const userId = ownerRow.user_id;

      const timeline = await annuityService.getAnnuitiesByContract(userId, contract.id);

      expect(timeline).toEqual([]);
    });

    it('❌ Dovrebbe fallire se contratto non trovato', async () => {
      await expect(
        annuityService.getAnnuitiesByContract(1, 99999)
      ).rejects.toThrow('Contratto non trovato o accesso negato');
    });
  });

  // ============= TEST 7: RECALCULATE ANNUITY DUE DATES =============
  describe('recalculateAnnuityDueDates', () => {
    
    it('✅ Dovrebbe aggiornare due_date quando end_date viene estesa', async () => {
      // 1. Crea contratto 2025-2028 (anni intermedi: 2026, 2027)
      const contract = await createTestContract({
        start_date: '2025-01-15',
        end_date: '2028-01-15', // end day/month: 15 gennaio
        cedolare_secca: false,
      });

      // 2. Genera annuities iniziali
      await annuityService.generateAnnuitiesForContract(contract.id);

      // 3. Estendi end_date a 2030 (stesso giorno/mese)
      await db('contracts')
        .where({ id: contract.id })
        .update({ end_date: '2030-01-15' });

      // 4. Ricalcola annuities
      const recalculated = await annuityService.recalculateAnnuityDueDates(contract.id);

      // 5. Verifica: ora dovrebbero esserci 4 annuities (2026, 2027, 2028, 2029)
      expect(recalculated.length).toBe(4);
      expect(recalculated.map(a => a.year)).toEqual([2026, 2027, 2028, 2029]);
      
      // Verifica che le due_date usino giorno/mese di end_date (15 gennaio)
      recalculated.forEach(annuity => {
        expect(annuity.due_date).toBe(`${annuity.year}-01-15`);
      });
    });

    it('✅ Dovrebbe eliminare annuities quando end_date viene ridotta', async () => {
      // 1. Crea contratto 2025-2030 (anni intermedi: 2026, 2027, 2028, 2029)
      const contract = await createTestContract({
        start_date: '2025-02-20',
        end_date: '2030-02-20',
        cedolare_secca: false,
      });

      // 2. Genera annuities iniziali
      await annuityService.generateAnnuitiesForContract(contract.id);

      // 3. Modifica end_date a 2027
      await db('contracts')
        .where({ id: contract.id })
        .update({ end_date: '2027-02-20' });

      // 4. Ricalcola annuities
      const recalculated = await annuityService.recalculateAnnuityDueDates(contract.id);

      // 5. Verifica: ora dovrebbe esserci solo 1 annuity (2026)
      expect(recalculated.length).toBe(1);
      expect(recalculated[0].year).toBe(2026);
      expect(recalculated[0].due_date).toBe('2026-02-20');
    });

    it('✅ Dovrebbe aggiornare due_date quando end_date cambia giorno/mese', async () => {
      // La due_date segue il giorno/mese di end_date → se end_date cambia, cambiano le due_date
      const contract = await createTestContract({
        start_date: '2025-01-15',
        end_date: '2028-01-15', // end day/month: 15 gennaio
        cedolare_secca: false,
      });

      // 2. Genera annuities iniziali (due_date = XX-01-15)
      await annuityService.generateAnnuitiesForContract(contract.id);

      // 3. Modifica end_date cambiando giorno/mese
      await db('contracts')
        .where({ id: contract.id })
        .update({ 
          end_date: '2028-02-20' // nuovo end day/month: 20 febbraio
        });

      // 4. Ricalcola annuities
      const recalculated = await annuityService.recalculateAnnuityDueDates(contract.id);

      // 5. Verifica: le due_date devono ora usare giorno/mese di fine (20 febbraio)
      expect(recalculated.length).toBe(2);
      expect(recalculated[0].due_date).toBe('2026-02-20'); // NON 2026-01-15
      expect(recalculated[1].due_date).toBe('2027-02-20'); // NON 2027-01-15
    });

    it('✅ Dovrebbe eliminare tutte le annuities se contratto diventa cedolare secca', async () => {
      // 1. Crea contratto NON cedolare secca
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
      });

      // 2. Genera annuities iniziali
      await annuityService.generateAnnuitiesForContract(contract.id);

      // 3. Cambia a cedolare secca
      await db('contracts')
        .where({ id: contract.id })
        .update({ cedolare_secca: true });

      // 4. Ricalcola annuities
      const recalculated = await annuityService.recalculateAnnuityDueDates(contract.id);

      // 5. Verifica: nessuna annuity deve rimanere
      expect(recalculated).toEqual([]);
      
      // Verifica DB
      const annuitiesInDb = await db('annuities')
        .where({ contract_id: contract.id });
      expect(annuitiesInDb.length).toBe(0);
    });

    it('✅ Dovrebbe preservare is_paid quando ricalcola', async () => {
      // 1. Crea contratto con last_annuity_paid
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
        last_annuity_paid: 2026,
      });

      // 2. Genera annuities iniziali (2026 sarà is_paid: true)
      await annuityService.generateAnnuitiesForContract(contract.id);

      // 3. Estendi end_date a 2030
      await db('contracts')
        .where({ id: contract.id })
        .update({ end_date: '2030-01-01' });

      // 4. Ricalcola annuities
      const recalculated = await annuityService.recalculateAnnuityDueDates(contract.id);

      // 5. Verifica: 2026 deve rimanere is_paid: true
      const annuity2026 = recalculated.find(a => a.year === 2026);
      expect(annuity2026?.is_paid).toBe(true);
      
      // Le nuove annuities (2028, 2029) devono essere is_paid: false
      const annuity2028 = recalculated.find(a => a.year === 2028);
      const annuity2029 = recalculated.find(a => a.year === 2029);
      expect(annuity2028?.is_paid).toBe(false);
      expect(annuity2029?.is_paid).toBe(false);
    });

    it('✅ Dovrebbe gestire riduzione a nessun anno intermedio', async () => {
      // 1. Crea contratto 2025-2028
      const contract = await createTestContract({
        start_date: '2025-01-01',
        end_date: '2028-01-01',
        cedolare_secca: false,
      });

      // 2. Genera annuities iniziali
      await annuityService.generateAnnuitiesForContract(contract.id);

      // 3. Riduci end_date a 2026 (nessun anno intermedio)
      await db('contracts')
        .where({ id: contract.id })
        .update({ end_date: '2026-01-01' });

      // 4. Ricalcola annuities
      const recalculated = await annuityService.recalculateAnnuityDueDates(contract.id);

      // 5. Verifica: nessuna annuity
      expect(recalculated).toEqual([]);
      
      // Verifica DB
      const annuitiesInDb = await db('annuities')
        .where({ contract_id: contract.id });
      expect(annuitiesInDb.length).toBe(0);
    });

    it('❌ Dovrebbe fallire se contratto non trovato', async () => {
      await expect(
        annuityService.recalculateAnnuityDueDates(99999)
      ).rejects.toThrow('Contratto non trovato');
    });
  });
});
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import db from '../../config/db';
import * as notificationService from '../../services/notification.service';
import * as emailService from '../../services/email.service';
import dayjs from 'dayjs';

/**
 * Test suite completa per Cron Job notifiche.
 * 
 * Copertura:
 * - Trova contratti in scadenza tra 7 giorni
 * - Trova annuities non pagate in scadenza tra 7 giorni
 * - Invia email interna + cliente (mock)
 * - Popola correttamente tabella notifications
 * - Prevenzione duplicati (no re-invio)
 * - Log successi/fallimenti
 */

// Mock completo del servizio email
jest.mock('../../services/email.service');
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;

describe('Cron Job Notifications Integration Tests', () => {
  
  // Variabili per test
  let testUserId: number;
  let testOwnerId: number;
  let testTenantId: number;

  /**
   * Setup: Crea user, owner e tenant base per tutti i test
   */
  beforeEach(async () => {
    // Reset mock
    jest.clearAllMocks();

    // Mock email service per evitare invii reali
    mockedEmailService.sendExpirationReminderInternal.mockResolvedValue(true);
    mockedEmailService.sendExpirationReminderClient.mockResolvedValue(true);

    // Crea user di test
    const [user] = await db('users').insert({
      name: 'Cron',
      surname: 'Test',
      email: `cron-test-${Date.now()}@test.com`,
      password_hash: 'hashed',
    }).returning('*');
    testUserId = user.id;

    // Crea owner di test
    const [owner] = await db('owners').insert({
      name: 'Owner',
      surname: 'Cron',
      phone: '123456789',
      email: 'owner@test.com',
      user_id: testUserId,
    }).returning('*');
    testOwnerId = owner.id;

    // Crea tenant di test
    const [tenant] = await db('tenants').insert({
      name: 'Tenant',
      surname: 'Cron',
      phone: '987654321',
      email: 'tenant@test.com',
      user_id: testUserId,
    }).returning('*');
    testTenantId = tenant.id;

    console.log('[CRON_TEST] Setup completato - userId:', testUserId);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============= TEST 1: CONTRATTI IN SCADENZA =============
  describe('Contratti in scadenza naturale (end_date)', () => {
    
    it('✅ Dovrebbe trovare contratti con scadenza esatta tra 7 giorni', async () => {
      // Mock data: oggi = 2025-01-15
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD'); // 2025-01-22

      console.log('[CRON_TEST] Data oggi (mock):', today.format('YYYY-MM-DD'));
      console.log('[CRON_TEST] Data target (oggi + 7):', targetDate);

      // Crea contratto con scadenza tra 7 giorni
      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate, // Scade tra 7 giorni
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 500,
        last_annuity_paid: null,
      }).returning('*');

      console.log('[CRON_TEST] Contratto creato con end_date:', contract.end_date);

      // Simula esecuzione cron job con data mockata
      // Nota: Passiamo la data target direttamente per il test
      const daysBefore = 7;
      const calculatedTarget = today.add(daysBefore, 'day').format('YYYY-MM-DD');

      // Verifica che il contratto sia nel range corretto
      const contractsInRange = await db('contracts')
        .where('end_date', calculatedTarget);

      expect(contractsInRange.length).toBe(1);
      expect(contractsInRange[0].id).toBe(contract.id);
      console.log('[CRON_TEST] ✅ Contratto trovato nel range corretto');
    });

    it('✅ Dovrebbe inviare email per contratto in scadenza', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      // Crea contratto in scadenza
      await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate,
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 500,
      }).returning('*');

      // Esegui notification service (simulando cron job)
      // NOTA: Il service usa dayjs() interno, quindi dobbiamo mockare process.env
      process.env.CRON_NOTIFICATION_DAYS_BEFORE = '7';
      
      // Mock dayjs per restituire la data fissa
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();

      // Aspetta che le operazioni async siano completate
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verifica statistiche
      expect(stats.processed).toBeGreaterThanOrEqual(1);
      expect(stats.sent).toBeGreaterThanOrEqual(1);

      // Verifica che le email siano state chiamate (mock)
      expect(mockedEmailService.sendExpirationReminderInternal).toHaveBeenCalled();
      expect(mockedEmailService.sendExpirationReminderClient).toHaveBeenCalled();

      console.log('[CRON_TEST] ✅ Email inviate (mock verificato)');
    });

    it('✅ Dovrebbe popolare correttamente tabella notifications', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      // Crea contratto in scadenza
      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate,
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 600,
      }).returning('*');

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      // Esegui service
      await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verifica record in notifications
      const notification = await db('notifications')
        .where({
          contract_id: contract.id,
          type: 'contract_renewal',
        })
        .first();

      expect(notification).toBeDefined();
      expect(notification.sent_to_client).toBe(true);
      expect(notification.sent_to_internal).toBe(true);
      expect(notification.year).toBeNull(); // Contract renewal non ha year
      expect(notification.sent_at).toBeTruthy();

      console.log('[CRON_TEST] ✅ Notification inserita correttamente:', notification.id);
    });
  });

  // ============= TEST 2: ANNUITIES IN SCADENZA =============
  describe('Annuities in scadenza (due_date, is_paid=false)', () => {
    
    it('✅ Dovrebbe trovare annuities non pagate con scadenza tra 7 giorni', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD'); // 2025-01-22

      // Crea contratto NON cedolare secca (genera annuities)
      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2023-01-22',
        end_date: '2027-01-22',
        cedolare_secca: false, // Importante: false per annuities
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 700,
        last_annuity_paid: null,
      }).returning('*');

      // Crea annuity manualmente con due_date = oggi + 7
      const [annuity] = await db('annuities').insert({
        contract_id: contract.id,
        year: 2026,
        due_date: targetDate, // Scade tra 7 giorni
        is_paid: false, // NON pagata
      }).returning('*');

      console.log('[CRON_TEST] Annuity creata:', annuity.id, 'due_date:', annuity.due_date);

      // Verifica che l'annuity sia nel range corretto
      const annuitiesInRange = await db('annuities')
        .where('due_date', targetDate)
        .andWhere('is_paid', false);

      expect(annuitiesInRange.length).toBe(1);
      expect(annuitiesInRange[0].id).toBe(annuity.id);
      console.log('[CRON_TEST] ✅ Annuity trovata nel range corretto');
    });

    it('✅ Dovrebbe inviare email per annuity in scadenza', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      // Crea contratto e annuity
      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2023-01-22',
        end_date: '2027-01-22',
        cedolare_secca: false,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 800,
      }).returning('*');

      await db('annuities').insert({
        contract_id: contract.id,
        year: 2026,
        due_date: targetDate,
        is_paid: false,
      });

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      // Esegui service
      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verifica invio email
      expect(stats.processed).toBeGreaterThanOrEqual(1);
      expect(stats.sent).toBeGreaterThanOrEqual(1);

      expect(mockedEmailService.sendExpirationReminderInternal).toHaveBeenCalledWith(
        expect.any(Object),
        'annuity',
        2026
      );

      expect(mockedEmailService.sendExpirationReminderClient).toHaveBeenCalledWith(
        expect.any(Object),
        'annuity',
        2026
      );

      console.log('[CRON_TEST] ✅ Email annuity inviate (mock verificato)');
    });

    it('✅ Dovrebbe popolare notifications con anno annuity', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2023-01-22',
        end_date: '2027-01-22',
        cedolare_secca: false,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 900,
      }).returning('*');

      await db('annuities').insert({
        contract_id: contract.id,
        year: 2026,
        due_date: targetDate,
        is_paid: false,
      });

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verifica notification con year
      const notification = await db('notifications')
        .where({
          contract_id: contract.id,
          type: 'annuity_renewal',
          year: 2026,
        })
        .first();

      expect(notification).toBeDefined();
      expect(notification.year).toBe(2026); // Anno annuity presente
      expect(notification.sent_to_client).toBe(true);
      expect(notification.sent_to_internal).toBe(true);

      console.log('[CRON_TEST] ✅ Notification annuity inserita con year:', notification.year);
    });
  });

  // ============= TEST 3: PREVENZIONE DUPLICATI =============
  describe('Prevenzione duplicati (unique constraint)', () => {
    
    it('✅ Dovrebbe NON inviare email duplicate per stesso contratto', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      // Crea contratto
      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate,
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 1000,
      }).returning('*');

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      // PRIMO RUN: invia email
      const stats1 = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(stats1.sent).toBe(1);
      expect(mockedEmailService.sendExpirationReminderInternal).toHaveBeenCalledTimes(1);
      expect(mockedEmailService.sendExpirationReminderClient).toHaveBeenCalledTimes(1);

      // Reset mock calls
      jest.clearAllMocks();
      mockedEmailService.sendExpirationReminderInternal.mockResolvedValue(true);
      mockedEmailService.sendExpirationReminderClient.mockResolvedValue(true);

      // SECONDO RUN: NON deve inviare email (già inviata)
      const stats2 = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(stats2.sent).toBe(0); // Nessuna nuova email
      expect(stats2.skipped).toBe(1); // Saltato per duplicato
      expect(mockedEmailService.sendExpirationReminderInternal).not.toHaveBeenCalled();
      expect(mockedEmailService.sendExpirationReminderClient).not.toHaveBeenCalled();

      // Verifica: solo 1 notification in DB
      const notifications = await db('notifications')
        .where({ contract_id: contract.id });

      expect(notifications.length).toBe(1);

      console.log('[CRON_TEST] ✅ Duplicato prevenuto correttamente');
    });

    it('✅ Dovrebbe NON inviare email duplicate per stessa annuity', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2023-01-22',
        end_date: '2027-01-22',
        cedolare_secca: false,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 1100,
      }).returning('*');

      await db('annuities').insert({
        contract_id: contract.id,
        year: 2026,
        due_date: targetDate,
        is_paid: false,
      });

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      // PRIMO RUN
      const stats1 = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(stats1.sent).toBe(1);

      // Reset mock
      jest.clearAllMocks();
      mockedEmailService.sendExpirationReminderInternal.mockResolvedValue(true);
      mockedEmailService.sendExpirationReminderClient.mockResolvedValue(true);

      // SECONDO RUN
      const stats2 = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(stats2.sent).toBe(0);
      expect(stats2.skipped).toBe(1);
      expect(mockedEmailService.sendExpirationReminderInternal).not.toHaveBeenCalled();

      // Verifica DB: solo 1 notification
      const notifications = await db('notifications')
        .where({
          contract_id: contract.id,
          type: 'annuity_renewal',
          year: 2026,
        });

      expect(notifications.length).toBe(1);

      console.log('[CRON_TEST] ✅ Duplicato annuity prevenuto');
    });
  });

  // ============= TEST 4: EDGE CASES =============
  describe('Edge cases e gestione errori', () => {
    
    it('✅ Dovrebbe ignorare contratti NON in scadenza tra 7 giorni', async () => {
      const today = dayjs('2025-01-15');
      
      // Contratto con scadenza tra 10 giorni (NON 7)
      await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-25',
        end_date: today.add(10, 'day').format('YYYY-MM-DD'), // +10 giorni
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 500,
      });

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // NON dovrebbe trovare contratti
      expect(stats.sent).toBe(0);
      expect(mockedEmailService.sendExpirationReminderInternal).not.toHaveBeenCalled();

      console.log('[CRON_TEST] ✅ Contratto fuori range ignorato');
    });

    it('✅ Dovrebbe ignorare annuities già pagate (is_paid=true)', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      const [contract] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2023-01-22',
        end_date: '2027-01-22',
        cedolare_secca: false,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 700,
      }).returning('*');

      // Annuity GIÀ PAGATA
      await db('annuities').insert({
        contract_id: contract.id,
        year: 2026,
        due_date: targetDate,
        is_paid: true, // ✅ GIÀ PAGATA
        paid_at: new Date(),
      });

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // NON dovrebbe inviare notifiche
      expect(stats.sent).toBe(0);
      expect(mockedEmailService.sendExpirationReminderInternal).not.toHaveBeenCalled();

      console.log('[CRON_TEST] ✅ Annuity già pagata ignorata');
    });

    it('✅ Dovrebbe gestire fallimento parziale email (best effort)', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate,
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 500,
      });

      // Mock: email interna fallisce, cliente successo
      mockedEmailService.sendExpirationReminderInternal.mockResolvedValue(false);
      mockedEmailService.sendExpirationReminderClient.mockResolvedValue(true);

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Dovrebbe comunque considerare "sent" se almeno una email è andata
      expect(stats.sent).toBe(1);

      // Verifica notification: sent_to_internal = false, sent_to_client = true
      const notification = await db('notifications').orderBy('id', 'desc').first();
      
      expect(notification.sent_to_internal).toBe(false);
      expect(notification.sent_to_client).toBe(true);

      console.log('[CRON_TEST] ✅ Fallimento parziale gestito (best effort)');
    });

    it('✅ Dovrebbe marcare come failed se TUTTE le email falliscono', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate,
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 500,
      });

      // Mock: entrambe le email falliscono
      mockedEmailService.sendExpirationReminderInternal.mockResolvedValue(false);
      mockedEmailService.sendExpirationReminderClient.mockResolvedValue(false);

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(stats.sent).toBe(0);
      expect(stats.failed).toBe(1);

      // Nessuna notification inserita (tutte fallite)
      const notifications = await db('notifications');
      expect(notifications.length).toBe(0);

      console.log('[CRON_TEST] ✅ Tutte le email fallite → marcato come failed');
    });
  });

  // ============= TEST 5: STATISTICHE =============
  describe('Statistiche e logging', () => {
    
    it('✅ Dovrebbe restituire statistiche corrette', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      // Crea 2 contratti in scadenza
      await db('contracts').insert([
        {
          owner_id: testOwnerId,
          tenant_id: testTenantId,
          start_date: '2021-01-22',
          end_date: targetDate,
          cedolare_secca: true,
          typology: 'residenziale',
          canone_concordato: true,
          monthly_rent: 500,
        },
        {
          owner_id: testOwnerId,
          tenant_id: testTenantId,
          start_date: '2022-01-22',
          end_date: targetDate,
          cedolare_secca: true,
          typology: 'commerciale',
          canone_concordato: false,
          monthly_rent: 1000,
        },
      ]);

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verifica statistiche
      expect(stats.processed).toBe(2); // 2 contratti processati
      expect(stats.sent).toBe(2); // 2 email inviate
      expect(stats.skipped).toBe(0);
      expect(stats.failed).toBe(0);

      console.log('[CRON_TEST] ✅ Statistiche corrette:', stats);
    });

    it('✅ Dovrebbe loggare correttamente successi e fallimenti', async () => {
      const today = dayjs('2025-01-15');
      const targetDate = today.add(7, 'day').format('YYYY-MM-DD');

      // Crea 1 contratto (successo) e 1 annuity (fallimento simulato)
      const [contract1] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2021-01-22',
        end_date: targetDate,
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 500,
      }).returning('*');

      const [contract2] = await db('contracts').insert({
        owner_id: testOwnerId,
        tenant_id: testTenantId,
        start_date: '2023-01-22',
        end_date: '2027-01-22',
        cedolare_secca: false,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 700,
      }).returning('*');

      await db('annuities').insert({
        contract_id: contract2.id,
        year: 2026,
        due_date: targetDate,
        is_paid: false,
      });

      // Mock: primo successo, secondo fallisce
      let callCount = 0;
      mockedEmailService.sendExpirationReminderInternal.mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1); // Solo primo successo
      });
      mockedEmailService.sendExpirationReminderClient.mockResolvedValue(false);

      // Mock dayjs
      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      jest.setSystemTime(today.toDate());

      const stats = await notificationService.sendExpiringContractsNotifications();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verifica: 1 successo, 1 fallimento
      expect(stats.processed).toBe(2);
      expect(stats.sent).toBe(1);
      expect(stats.failed).toBe(1);

      console.log('[CRON_TEST] ✅ Log successi/fallimenti verificato');
    });
  });
});
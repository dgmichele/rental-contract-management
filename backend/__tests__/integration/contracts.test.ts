import request from 'supertest';
import app from '../../server';
import db from '../../config/db';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestUser, createTestOwner, createTestTenant, createTestContract } from '../helpers/factories';

describe('Contracts Integration Tests', () => {
  let user: any;
  let token: string;
  let owner: any;
  let tenant: any;

  beforeEach(async () => {
    // Setup base: User + Token + 1 Owner + 1 Tenant
    const auth = await createTestUser();
    user = auth.user;
    token = auth.token;
    owner = await createTestOwner(user.id);
    tenant = await createTestTenant(user.id);
  });
  
  // Pulizia extra per sicurezza (gestita già globalmente ma utile per isolamento)
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // ============= CREATE CONTRACT =============
  describe('POST /api/contract', () => {
    
    it('✅ Dovrebbe creare un contratto con tenant esistente (tenant_id)', async () => {
      const contractData = {
        owner_id: owner.id,
        tenant_id: tenant.id,
        start_date: '2025-01-01',
        end_date: '2029-01-01',
        cedolare_secca: false,
        typology: 'residenziale',
        canone_concordato: true,
        monthly_rent: 850.50,
      };

      const response = await request(app)
        .post('/api/contract')
        .set('Authorization', `Bearer ${token}`)
        .send(contractData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(Number(response.body.data.monthly_rent)).toBe(850.50);
      
      // Verifica DB
      const dbContract = await db('contracts').where({ id: response.body.data.id }).first();
      expect(dbContract).toBeDefined();
      expect(dbContract.tenant_id).toBe(tenant.id);
    });

    it('✅ Dovrebbe creare un contratto E un nuovo tenant (tenant_data)', async () => {
      const newTenantData = {
        name: 'Nuovo',
        surname: 'Inquilino',
        email: 'nuovo@test.com',
        phone: '333000000'
      };

      const contractData = {
        owner_id: owner.id,
        tenant_data: newTenantData, // Nested creation
        start_date: '2025-01-01',
        end_date: '2029-01-01',
        cedolare_secca: true,
        typology: 'residenziale',
        canone_concordato: false,
        monthly_rent: 1000,
      };

      const response = await request(app)
        .post('/api/contract')
        .set('Authorization', `Bearer ${token}`)
        .send(contractData)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      // Verifica che il tenant sia stato creato
      const createdTenant = await db('tenants').where({ email: 'nuovo@test.com' }).first();
      expect(createdTenant).toBeDefined();
      expect(createdTenant.user_id).toBe(user.id); // Deve essere assegnato all'utente corrente

      // Verifica collegamento contratto
      expect(response.body.data.tenant_id).toBe(createdTenant.id);
    });
  });

  // ============= UPDATE CONTRACT =============
  describe('PUT /api/contract/:id', () => {
    
    it('✅ Dovrebbe aggiornare un contratto esistente', async () => {
      const contract = await createTestContract(owner.id, tenant.id);

      const updateData = {
        monthly_rent: 1200.00,
        address: 'Via Roma 10'
      };

      const response = await request(app)
        .put(`/api/contract/${contract.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(Number(response.body.data.monthly_rent)).toBe(1200.00);
      expect(response.body.data.address).toBe('Via Roma 10');

      // DB check
      const updated = await db('contracts').where({ id: contract.id }).first();
      expect(Number(updated.monthly_rent)).toBe(1200.00);
    });

    it('❌ Dovrebbe impedire aggiornamento di contratto altrui', async () => {
      // Crea un altro utente e un suo contratto
      const otherAuth = await createTestUser({ email: 'hacker@test.com' });
      const otherOwner = await createTestOwner(otherAuth.user.id);
      const otherTenant = await createTestTenant(otherAuth.user.id);
      const otherContract = await createTestContract(otherOwner.id, otherTenant.id);

      // Tenta di aggiornare col token del primo utente
      await request(app)
        .put(`/api/contract/${otherContract.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monthly_rent: 1000 })
        .expect(404); // O 403 a seconda dell'implementazione (spesso 404 per sicurezza)
    });
  });

  // ============= DELETE CONTRACT =============
  describe('DELETE /api/contract/:id', () => {
    
    it('✅ Dovrebbe eliminare contratto e annullare annualità (Cascade)', async () => {
      // Crea contratto NON cedolare secca (genera annualità)
      const contract = await createTestContract(owner.id, tenant.id, { cedolare_secca: false });
      
      // Genera annualità (mockando la chiamata automatica o creandola manualmente per il test)
      // Poiché il controller chiama il service che genera annualità, se usiamo l'endpoint POST 
      // verrebbero create. Qui usiamo la factory, quindi le creiamo a mano per testare il cascade DB.
      await db('annuities').insert({
        contract_id: contract.id,
        year: 2026,
        due_date: '2026-01-01',
        is_paid: false
      });

      // Esegui delete
      await request(app)
        .delete(`/api/contract/${contract.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verifica Contratto eliminato
      const contractInDb = await db('contracts').where({ id: contract.id }).first();
      expect(contractInDb).toBeUndefined();

      // Verifica Annualità eliminate (Cascade)
      const annuitiesInDb = await db('annuities').where({ contract_id: contract.id });
      expect(annuitiesInDb.length).toBe(0);
    });
  });

  // ============= FILTERS & PAGINATION =============
  describe('GET /api/contract (Filters)', () => {
    
    it('✅ Dovrebbe filtrare per ownerId', async () => {
      // Crea un secondo owner per lo stesso utente
      const owner2 = await createTestOwner(user.id, { email: 'owner2@test.com' });
      
      // Contratto Owner 1
      await createTestContract(owner.id, tenant.id);
      // Contratto Owner 2
      await createTestContract(owner2.id, tenant.id);

      const response = await request(app)
        .get(`/api/contract?ownerId=${owner.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].owner_id).toBe(owner.id);
    });

    it('✅ Dovrebbe filtrare per scadenza (expiryMonth/Year)', async () => {
      // Contratto che scade a Giugno 2029
      await createTestContract(owner.id, tenant.id, { end_date: '2029-06-15' });
      // Contratto che scade a Dicembre 2029
      await createTestContract(owner.id, tenant.id, { end_date: '2029-12-31' });

      // Filtra Giugno 2029
      const response = await request(app)
        .get('/api/contract?expiryMonth=6&expiryYear=2029')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].end_date).toContain('2029-06');
    });

    it('✅ Dovrebbe supportare la paginazione', async () => {
      // Crea 15 contratti
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(createTestContract(owner.id, tenant.id));
      }
      await Promise.all(promises);

      // Pagina 1, limit 10
      const res1 = await request(app)
        .get('/api/contract?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res1.body.data).toHaveLength(10);
      expect(res1.body.pagination.total).toBe(15);

      // Pagina 2, limit 10
      const res2 = await request(app)
        .get('/api/contract?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res2.body.data).toHaveLength(5);
    });
  });
});
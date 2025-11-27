import request from 'supertest';
import app from '../../server';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestUser, createTestOwner, createTestTenant } from '../helpers/factories';

describe('Contract Validation Logic (Zod)', () => {
  let token: string;
  let ownerId: number;
  let tenantId: number;

  beforeEach(async () => {
    const auth = await createTestUser();
    token = auth.token;
    const owner = await createTestOwner(auth.user.id);
    const tenant = await createTestTenant(auth.user.id);
    ownerId = owner.id;
    tenantId = tenant.id;
  });

  const validContractData = () => ({
    owner_id: ownerId,
    tenant_id: tenantId,
    start_date: '2025-01-01',
    end_date: '2029-01-01',
    cedolare_secca: true,
    typology: 'residenziale',
    canone_concordato: false,
    monthly_rent: 500
  });

  // ============= DATE VALIDATION =============
  
  it('❌ Dovrebbe fallire se end_date è precedente a start_date', async () => {
    const invalidData = {
      ...validContractData(),
      start_date: '2025-01-01',
      end_date: '2024-01-01', // Precedente!
    };

    const response = await request(app)
      .post('/api/contract')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toContain('La data di fine deve essere successiva');
  });

  it('❌ Dovrebbe fallire se formato data non valido', async () => {
    const invalidData = {
      ...validContractData(),
      start_date: '01-01-2025', // DD-MM-YYYY invece di YYYY-MM-DD
    };

    const response = await request(app)
      .post('/api/contract')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  // ============= TENANT XOR VALIDATION =============
  
  it('❌ Dovrebbe fallire se mancano sia tenant_id che tenant_data', async () => {
    const invalidData = {
      ...validContractData(),
      tenant_id: undefined,
      tenant_data: undefined
    };

    const response = await request(app)
      .post('/api/contract')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toContain('tenant_id (esistente) o tenant_data (nuovo)');
  });

  it('❌ Dovrebbe fallire se presenti ENTRAMBI tenant_id e tenant_data', async () => {
    const invalidData = {
      ...validContractData(),
      tenant_id: tenantId,
      tenant_data: { name: 'Mario', surname: 'Doppio' }
    };

    const response = await request(app)
      .post('/api/contract')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toContain('non entrambi');
  });

  // ============= NUMERIC & ENUM VALIDATION =============

  it('❌ Dovrebbe fallire con monthly_rent negativo', async () => {
    const invalidData = {
      ...validContractData(),
      monthly_rent: -500
    };

    const response = await request(app)
      .post('/api/contract')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);
      
    // Zod error standard per .positive()
    expect(response.body.success).toBe(false);
  });

  it('❌ Dovrebbe fallire con tipologia non valida', async () => {
    const invalidData = {
      ...validContractData(),
      typology: 'industriale' // Non in enum ['residenziale', 'commerciale']
    };

    const response = await request(app)
      .post('/api/contract')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);
      
    expect(response.body.message).toContain('Tipologia deve essere');
  });
});
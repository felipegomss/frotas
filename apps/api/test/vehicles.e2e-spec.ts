import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

const ISSUER = 'https://fake-issuer.local';
const AUDIENCE = 'frotas-api';

// Env must be set before the app (and its providers) are constructed.
process.env.DATABASE_URL ??=
  'postgresql://frotas:frotas@localhost:5432/frotas?schema=admin';
process.env.SESSION_TOKEN_SECRET = 'e2e-session-secret';
process.env.IDP_ISSUER = ISSUER;
process.env.IDP_AUDIENCE = AUDIENCE;

import { AppModule } from '../src/app.module';
import { IDP_JWKS } from '../src/auth/idp-verifier';
import { makeIdpKit, type IdpKit } from './support/idp-kit';
import { seedTestData, type SeededData } from './support/seed-test-data';

describe('Vehicles (e2e)', () => {
  let app: INestApplication<App>;
  let idp: IdpKit;
  let seed: SeededData;
  let sessionToken: string;
  let secretariatId: string;

  interface VehicleBody {
    id: string;
    plate: string;
    model: string;
    year: number;
    type: string;
    secretariatId: string;
    status: string;
    currentMileage: number;
  }

  const validAttrs = () => ({
    plate: 'TST1A23',
    model: 'Fiat Strada',
    year: 2022,
    type: 'pickup',
    secretariatId,
    currentMileage: 15000,
  });

  beforeAll(async () => {
    idp = await makeIdpKit(ISSUER, AUDIENCE);
    seed = await seedTestData();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IDP_JWKS)
      .useValue(idp.jwks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const idpToken = await idp.sign(seed.identitySub);
    const session = await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', `Bearer ${idpToken}`)
      .send({ tenantId: seed.tenantDemoId })
      .expect(200);
    sessionToken = (session.body as { token: string }).token;

    const secretariat = await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: `Secretaria de Teste ${Date.now()}` })
      .expect(201);
    secretariatId = (secretariat.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const bearer = (token: string) => `Bearer ${token}`;
  function auth() {
    return bearer(sessionToken);
  }

  it('AC1: POST /veiculos creates a vehicle and it appears in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send(validAttrs())
      .expect(201);

    const body = created.body as VehicleBody;
    expect(body).toMatchObject({
      plate: 'TST1A23',
      model: 'Fiat Strada',
      year: 2022,
      type: 'pickup',
      secretariatId,
      status: 'available',
      currentMileage: 15000,
    });
    expect(typeof body.id).toBe('string');

    const list = await request(app.getHttpServer())
      .get('/veiculos')
      .set('Authorization', auth())
      .expect(200);

    const plates = (list.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).toContain('TST1A23');
  });

  it('AC2: a duplicate plate is rejected with 409', async () => {
    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'DUP1D23' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'DUP1D23' })
      .expect(409);
  });

  it('AC3: invalid plate, year, type, mileage or status are rejected with 400', async () => {
    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'INVALID' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'YER1A23', year: 1899 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'TYP1A23', type: 'spaceship' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'MIL1A23', currentMileage: -1 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'STA1A23', status: 'in_use' })
      .expect(400);
  });

  it('AC4: GET /veiculos returns only the tenant vehicles of the session', async () => {
    const res = await request(app.getHttpServer())
      .get('/veiculos')
      .set('Authorization', auth())
      .expect(200);

    const plates = (res.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).toContain('TST1A23');
    expect(plates).not.toContain('ZZZ9Z99');
  });

  it('AC5: a forged X-Tenant-Schema header is ignored (claim wins)', async () => {
    const res = await request(app.getHttpServer())
      .get('/veiculos')
      .set('Authorization', auth())
      .set('X-Tenant-Schema', 'tenant_prefdemo2')
      .expect(200);

    const plates = (res.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).not.toContain('ZZZ9Z99');
  });

  it('AC6: any /veiculos route without a valid session token is rejected with 401', async () => {
    await request(app.getHttpServer()).get('/veiculos').expect(401);

    await request(app.getHttpServer())
      .get('/veiculos')
      .set('Authorization', 'Bearer garbage.token.value')
      .expect(401);

    await request(app.getHttpServer())
      .post('/veiculos')
      .send(validAttrs())
      .expect(401);
  });

  it('AC7/AC9: PUT edits and DELETE removes a vehicle', async () => {
    const created = await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'EDT1D23' })
      .expect(201);
    const id = (created.body as VehicleBody).id;

    const updated = await request(app.getHttpServer())
      .put(`/veiculos/${id}`)
      .set('Authorization', auth())
      .send({
        ...validAttrs(),
        plate: 'EDT1D23',
        model: 'VW Saveiro',
        year: 2023,
        type: 'car',
        status: 'inactive',
      })
      .expect(200);
    expect(updated.body as VehicleBody).toMatchObject({
      model: 'VW Saveiro',
      year: 2023,
      type: 'car',
      status: 'inactive',
    });

    const afterUpdate = await request(app.getHttpServer())
      .get(`/veiculos/${id}`)
      .set('Authorization', auth())
      .expect(200);
    expect((afterUpdate.body as VehicleBody).model).toBe('VW Saveiro');

    await request(app.getHttpServer())
      .delete(`/veiculos/${id}`)
      .set('Authorization', auth())
      .expect(204);

    const list = await request(app.getHttpServer())
      .get('/veiculos')
      .set('Authorization', auth())
      .expect(200);
    const plates = (list.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).not.toContain('EDT1D23');
  });

  it('AC8: GET/PUT/DELETE with a non-existent id return 404', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await request(app.getHttpServer())
      .get(`/veiculos/${missingId}`)
      .set('Authorization', auth())
      .expect(404);

    await request(app.getHttpServer())
      .put(`/veiculos/${missingId}`)
      .set('Authorization', auth())
      .send(validAttrs())
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/veiculos/${missingId}`)
      .set('Authorization', auth())
      .expect(404);
  });

  it('AC10: editing to a plate used by another vehicle returns 409', async () => {
    const first = await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'FIR1D23' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'SEC1D23' })
      .expect(201);
    const secondId = (second.body as VehicleBody).id;
    void first;

    await request(app.getHttpServer())
      .put(`/veiculos/${secondId}`)
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'FIR1D23' })
      .expect(409);
  });

  it('AC11: a non-existent secretariatId returns 404 and creates/updates nothing', async () => {
    const missingSecretariatId = '00000000-0000-0000-0000-000000000000';

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({
        ...validAttrs(),
        plate: 'SEC1A23',
        secretariatId: missingSecretariatId,
      })
      .expect(404);

    const list = await request(app.getHttpServer())
      .get('/veiculos')
      .set('Authorization', auth())
      .expect(200);
    const plates = (list.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).not.toContain('SEC1A23');
  });

  it('AC13: GET /frota keeps returning only available tenant vehicles', async () => {
    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({ ...validAttrs(), plate: 'INA1D23', status: 'inactive' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/frota')
      .set('Authorization', auth())
      .expect(200);

    const plates = (res.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).not.toContain('INA1D23');
    expect(plates).not.toContain('ZZZ9Z99');
  });
});

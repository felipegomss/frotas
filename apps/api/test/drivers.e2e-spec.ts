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

describe('Drivers (e2e)', () => {
  let app: INestApplication<App>;
  let idp: IdpKit;
  let seed: SeededData;
  let sessionToken: string;
  let secretariatId: string;

  interface DriverBody {
    id: string;
    name: string;
    cnhCategory: string;
    cnhExpiry: string;
    secretariatId: string;
    status: string;
    authorizedVehicleIds: string[];
  }
  const MISSING = '00000000-0000-0000-0000-000000000000';

  const validDriver = () => ({
    name: 'Carlos Pereira',
    cnhCategory: 'D',
    cnhExpiry: '2027-05-31',
    secretariatId,
    authorizedVehicleIds: [] as string[],
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
      .send({ name: `Motoristas ${Date.now()}` })
      .expect(201);
    secretariatId = (secretariat.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const bearer = (token: string) => `Bearer ${token}`;
  const auth = () => bearer(sessionToken);

  async function createVehicle(plate: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({
        plate,
        model: 'Fiat Strada',
        year: 2022,
        type: 'pickup',
        secretariatId,
        currentMileage: 1000,
      })
      .expect(201);
    return (created.body as { id: string }).id;
  }

  it('AC1: POST /motoristas creates a driver and it appears in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/motoristas')
      .set('Authorization', auth())
      .send(validDriver())
      .expect(201);

    const body = created.body as DriverBody;
    expect(body.name).toBe('Carlos Pereira');
    expect(body.status).toBe('active');
    expect(body.authorizedVehicleIds).toEqual([]);
    expect(typeof body.id).toBe('string');

    const list = await request(app.getHttpServer())
      .get('/motoristas')
      .set('Authorization', auth())
      .expect(200);
    const names = (list.body as DriverBody[]).map((d) => d.name);
    expect(names).toContain('Carlos Pereira');
  });

  it('AC2: invalid payloads are rejected with 400', async () => {
    const base = validDriver();
    const bad = [
      { ...base, name: '   ' },
      { ...base, cnhCategory: 'Z' },
      { ...base, cnhExpiry: '2027-13-01' },
      { ...base, cnhExpiry: '31/05/2027' },
      { ...base, status: 'banned' },
    ];
    for (const payload of bad) {
      await request(app.getHttpServer())
        .post('/motoristas')
        .set('Authorization', auth())
        .send(payload)
        .expect(400);
    }
  });

  it('AC3: GET /motoristas returns only the tenant drivers of the session', async () => {
    const res = await request(app.getHttpServer())
      .get('/motoristas')
      .set('Authorization', auth())
      .expect(200);

    const names = (res.body as DriverBody[]).map((d) => d.name);
    expect(names).toContain('João Silva'); // seeded in tenant_prefdemo
    expect(names).not.toContain('Maria Souza'); // seeded in tenant_prefdemo2
  });

  it('AC4: a forged X-Tenant-Schema header is ignored (claim wins)', async () => {
    const res = await request(app.getHttpServer())
      .get('/motoristas')
      .set('Authorization', auth())
      .set('X-Tenant-Schema', 'tenant_prefdemo2')
      .expect(200);

    const names = (res.body as DriverBody[]).map((d) => d.name);
    expect(names).toContain('João Silva');
    expect(names).not.toContain('Maria Souza');
  });

  it('AC5: any /motoristas route without a valid session token is rejected with 401', async () => {
    await request(app.getHttpServer()).get('/motoristas').expect(401);
    await request(app.getHttpServer())
      .get('/motoristas')
      .set('Authorization', 'Bearer garbage.token.value')
      .expect(401);
    await request(app.getHttpServer())
      .post('/motoristas')
      .send(validDriver())
      .expect(401);
  });

  it('AC6/AC8: PUT edits and DELETE removes a driver', async () => {
    const created = await request(app.getHttpServer())
      .post('/motoristas')
      .set('Authorization', auth())
      .send({ ...validDriver(), name: 'Antes' })
      .expect(201);
    const id = (created.body as DriverBody).id;

    const updated = await request(app.getHttpServer())
      .put(`/motoristas/${id}`)
      .set('Authorization', auth())
      .send({
        ...validDriver(),
        name: 'Depois',
        cnhCategory: 'AB',
        status: 'inactive',
      })
      .expect(200);
    const body = updated.body as DriverBody;
    expect(body.name).toBe('Depois');
    expect(body.cnhCategory).toBe('AB');
    expect(body.status).toBe('inactive');

    const afterUpdate = await request(app.getHttpServer())
      .get(`/motoristas/${id}`)
      .set('Authorization', auth())
      .expect(200);
    expect((afterUpdate.body as DriverBody).name).toBe('Depois');

    await request(app.getHttpServer())
      .delete(`/motoristas/${id}`)
      .set('Authorization', auth())
      .expect(204);

    await request(app.getHttpServer())
      .get(`/motoristas/${id}`)
      .set('Authorization', auth())
      .expect(404);
  });

  it('AC7: GET/PUT/DELETE with a non-existent id return 404', async () => {
    await request(app.getHttpServer())
      .get(`/motoristas/${MISSING}`)
      .set('Authorization', auth())
      .expect(404);
    await request(app.getHttpServer())
      .put(`/motoristas/${MISSING}`)
      .set('Authorization', auth())
      .send(validDriver())
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/motoristas/${MISSING}`)
      .set('Authorization', auth())
      .expect(404);
  });

  it('AC9: a secretariatId absent from the tenant returns 404', async () => {
    await request(app.getHttpServer())
      .post('/motoristas')
      .set('Authorization', auth())
      .send({ ...validDriver(), secretariatId: MISSING })
      .expect(404);
  });

  it('AC10: an authorized vehicle absent from the tenant returns 404 and is not persisted', async () => {
    await request(app.getHttpServer())
      .post('/motoristas')
      .set('Authorization', auth())
      .send({
        ...validDriver(),
        name: 'NaoDeveExistir',
        authorizedVehicleIds: [MISSING],
      })
      .expect(404);

    const list = await request(app.getHttpServer())
      .get('/motoristas')
      .set('Authorization', auth())
      .expect(200);
    const names = (list.body as DriverBody[]).map((d) => d.name);
    expect(names).not.toContain('NaoDeveExistir');
  });

  it('AC11: the authorized-vehicle set round-trips and PUT replaces it', async () => {
    const v1 = await createVehicle('AUT1D23');
    const v2 = await createVehicle('AUT2D23');

    const created = await request(app.getHttpServer())
      .post('/motoristas')
      .set('Authorization', auth())
      .send({
        ...validDriver(),
        name: 'Autorizado',
        authorizedVehicleIds: [v1, v2],
      })
      .expect(201);
    const id = (created.body as DriverBody).id;

    const fetched = await request(app.getHttpServer())
      .get(`/motoristas/${id}`)
      .set('Authorization', auth())
      .expect(200);
    expect((fetched.body as DriverBody).authorizedVehicleIds.sort()).toEqual(
      [v1, v2].sort(),
    );

    const replaced = await request(app.getHttpServer())
      .put(`/motoristas/${id}`)
      .set('Authorization', auth())
      .send({
        ...validDriver(),
        name: 'Autorizado',
        authorizedVehicleIds: [v1],
      })
      .expect(200);
    expect((replaced.body as DriverBody).authorizedVehicleIds).toEqual([v1]);
  });

  it('AC13: deleting a vehicle authorized to a driver still works and drops the link', async () => {
    const v = await createVehicle('CAS1D23');
    const created = await request(app.getHttpServer())
      .post('/motoristas')
      .set('Authorization', auth())
      .send({ ...validDriver(), name: 'ComCascade', authorizedVehicleIds: [v] })
      .expect(201);
    const id = (created.body as DriverBody).id;

    await request(app.getHttpServer())
      .delete(`/veiculos/${v}`)
      .set('Authorization', auth())
      .expect(204);

    const fetched = await request(app.getHttpServer())
      .get(`/motoristas/${id}`)
      .set('Authorization', auth())
      .expect(200);
    expect((fetched.body as DriverBody).authorizedVehicleIds).not.toContain(v);
  });

  // AC12 (secretaria com motorista → 409) vive em secretariats.e2e-spec.ts,
  // junto do caso irmão de veículo em uso (mesma proteção de FK).
});

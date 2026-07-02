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

describe('Secretariats (e2e)', () => {
  let app: INestApplication<App>;
  let idp: IdpKit;
  let seed: SeededData;
  let sessionToken: string;

  interface SecretariatBody {
    id: string;
    name: string;
  }

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
  });

  afterAll(async () => {
    await app.close();
  });

  const bearer = (token: string) => `Bearer ${token}`;
  const auth = () => bearer(sessionToken);

  it('AC1: POST /secretarias creates a secretariat and it appears in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: 'Obras' })
      .expect(201);

    const body = created.body as SecretariatBody;
    expect(body.name).toBe('Obras');
    expect(typeof body.id).toBe('string');

    const list = await request(app.getHttpServer())
      .get('/secretarias')
      .set('Authorization', auth())
      .expect(200);

    const names = (list.body as SecretariatBody[]).map((s) => s.name);
    expect(names).toContain('Obras');
  });

  it('AC2: a duplicate name is rejected with 409', async () => {
    await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: 'Duplicada' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: 'Duplicada' })
      .expect(409);
  });

  it('AC3: an empty name is rejected with 400', async () => {
    await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: '' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: '   ' })
      .expect(400);
  });

  it('AC4: GET /secretarias returns only the tenant secretariats of the session', async () => {
    const res = await request(app.getHttpServer())
      .get('/secretarias')
      .set('Authorization', auth())
      .expect(200);

    const names = (res.body as SecretariatBody[]).map((s) => s.name);
    expect(names).toContain('Saúde');
    expect(names).not.toContain('Educação');
  });

  it('AC5: a forged X-Tenant-Schema header is ignored (claim wins)', async () => {
    const res = await request(app.getHttpServer())
      .get('/secretarias')
      .set('Authorization', auth())
      .set('X-Tenant-Schema', 'tenant_demo2')
      .expect(200);

    const names = (res.body as SecretariatBody[]).map((s) => s.name);
    expect(names).toContain('Saúde');
    expect(names).not.toContain('Educação');
  });

  it('AC6: any /secretarias route without a valid session token is rejected with 401', async () => {
    await request(app.getHttpServer()).get('/secretarias').expect(401);

    await request(app.getHttpServer())
      .get('/secretarias')
      .set('Authorization', 'Bearer garbage.token.value')
      .expect(401);

    await request(app.getHttpServer())
      .post('/secretarias')
      .send({ name: 'Sem Sessão' })
      .expect(401);
  });

  it('AC7/AC9: PUT renames and DELETE removes a secretariat', async () => {
    const created = await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: 'Antigo Nome' })
      .expect(201);
    const id = (created.body as SecretariatBody).id;

    const updated = await request(app.getHttpServer())
      .put(`/secretarias/${id}`)
      .set('Authorization', auth())
      .send({ name: 'Novo Nome' })
      .expect(200);
    expect((updated.body as SecretariatBody).name).toBe('Novo Nome');

    const afterUpdate = await request(app.getHttpServer())
      .get(`/secretarias/${id}`)
      .set('Authorization', auth())
      .expect(200);
    expect((afterUpdate.body as SecretariatBody).name).toBe('Novo Nome');

    await request(app.getHttpServer())
      .delete(`/secretarias/${id}`)
      .set('Authorization', auth())
      .expect(204);

    const list = await request(app.getHttpServer())
      .get('/secretarias')
      .set('Authorization', auth())
      .expect(200);
    const names = (list.body as SecretariatBody[]).map((s) => s.name);
    expect(names).not.toContain('Novo Nome');
  });

  it('AC8: GET/PUT/DELETE with a non-existent id return 404', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await request(app.getHttpServer())
      .get(`/secretarias/${missingId}`)
      .set('Authorization', auth())
      .expect(404);

    await request(app.getHttpServer())
      .put(`/secretarias/${missingId}`)
      .set('Authorization', auth())
      .send({ name: 'Qualquer' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/secretarias/${missingId}`)
      .set('Authorization', auth())
      .expect(404);
  });

  it('AC10: renaming to a name used by another secretariat returns 409', async () => {
    const first = await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: 'Primeira' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: 'Segunda' })
      .expect(201);
    const secondId = (second.body as SecretariatBody).id;
    void first;

    await request(app.getHttpServer())
      .put(`/secretarias/${secondId}`)
      .set('Authorization', auth())
      .send({ name: 'Primeira' })
      .expect(409);
  });

  it('AC12 (M0-F04): deleting a secretariat with vehicles returns 409', async () => {
    const secretariat = await request(app.getHttpServer())
      .post('/secretarias')
      .set('Authorization', auth())
      .send({ name: `Em Uso ${Date.now()}` })
      .expect(201);
    const secretariatId = (secretariat.body as SecretariatBody).id;

    await request(app.getHttpServer())
      .post('/veiculos')
      .set('Authorization', auth())
      .send({
        plate: 'USO1D23',
        model: 'Fiat Strada',
        year: 2022,
        type: 'pickup',
        secretariatId,
        currentMileage: 1000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/secretarias/${secretariatId}`)
      .set('Authorization', auth())
      .expect(409);

    await request(app.getHttpServer())
      .get(`/secretarias/${secretariatId}`)
      .set('Authorization', auth())
      .expect(200);
  });
});

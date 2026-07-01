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

describe('Auth + tenant isolation (e2e)', () => {
  let app: INestApplication<App>;
  let idp: IdpKit;
  let seed: SeededData;

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
  });

  afterAll(async () => {
    await app.close();
  });

  const bearer = (token: string) => `Bearer ${token}`;

  interface SessionBody {
    token: string;
    tenant: { id: string; slug: string; name: string };
    role: string;
  }
  interface PrefectureBody {
    id: string;
    slug: string;
    name: string;
    role: string;
  }
  interface VehicleBody {
    plate: string;
  }

  it('AC7: lists only the identity active memberships', async () => {
    const idpToken = await idp.sign(seed.identitySub);

    const res = await request(app.getHttpServer())
      .get('/sessao/prefeituras')
      .set('Authorization', bearer(idpToken))
      .expect(200);

    const body = res.body as PrefectureBody[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ slug: 'demo', role: 'manager' });
  });

  it('AC1: POST /sessao mints a signed session token with the tenant claim', async () => {
    const idpToken = await idp.sign(seed.identitySub);

    const res = await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(idpToken))
      .send({ tenantId: seed.tenantDemoId })
      .expect(200);

    const body = res.body as SessionBody;
    expect(typeof body.token).toBe('string');
    expect(body.tenant).toMatchObject({ slug: 'demo' });
    expect(body.role).toBe('manager');
  });

  it('AC2: invalid IdP token is rejected with 401', async () => {
    const badToken = await idp.signWithForeignKey(seed.identitySub);

    await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(badToken))
      .send({ tenantId: seed.tenantDemoId })
      .expect(401);
  });

  it('AC2: IdP token with wrong audience is rejected with 401', async () => {
    const token = await idp.signWithClaims(seed.identitySub, {
      audience: 'someone-else',
    });

    await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(token))
      .send({ tenantId: seed.tenantDemoId })
      .expect(401);
  });

  it('AC2: IdP token with wrong issuer is rejected with 401', async () => {
    const token = await idp.signWithClaims(seed.identitySub, {
      issuer: 'https://evil-issuer.local',
    });

    await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(token))
      .send({ tenantId: seed.tenantDemoId })
      .expect(401);
  });

  it('AC3: no active membership in the tenant is rejected with 403', async () => {
    const idpToken = await idp.sign(seed.identitySub);

    await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(idpToken))
      .send({ tenantId: seed.tenantDemo2Id })
      .expect(403);
  });

  it('AC4: GET /frota returns only the vehicles of the session tenant', async () => {
    const idpToken = await idp.sign(seed.identitySub);
    const session = await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(idpToken))
      .send({ tenantId: seed.tenantDemoId })
      .expect(200);

    const token = (session.body as SessionBody).token;
    const res = await request(app.getHttpServer())
      .get('/frota')
      .set('Authorization', bearer(token))
      .expect(200);

    const plates = (res.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).toContain('ABC1D23');
    expect(plates).not.toContain('ZZZ9Z99');
  });

  it('AC5: a forged X-Tenant-Schema header is ignored (claim wins)', async () => {
    const idpToken = await idp.sign(seed.identitySub);
    const session = await request(app.getHttpServer())
      .post('/sessao')
      .set('Authorization', bearer(idpToken))
      .send({ tenantId: seed.tenantDemoId })
      .expect(200);

    const token = (session.body as SessionBody).token;
    const res = await request(app.getHttpServer())
      .get('/frota')
      .set('Authorization', bearer(token))
      .set('X-Tenant-Schema', 'tenant_demo2')
      .expect(200);

    const plates = (res.body as VehicleBody[]).map((v) => v.plate);
    expect(plates).toContain('ABC1D23');
    expect(plates).not.toContain('ZZZ9Z99');
  });

  it('AC6: GET /frota without a session token is rejected with 401', async () => {
    await request(app.getHttpServer()).get('/frota').expect(401);

    await request(app.getHttpServer())
      .get('/frota')
      .set('Authorization', bearer('garbage.token.value'))
      .expect(401);
  });
});

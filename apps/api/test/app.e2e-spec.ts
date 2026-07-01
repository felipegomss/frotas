import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

// AppModule now boots AuthModule (ADR 0010); provide the env it validates.
process.env.DATABASE_URL ??=
  'postgresql://frotas:frotas@localhost:5432/frotas?schema=admin';
process.env.SESSION_TOKEN_SECRET = 'e2e-session-secret';
process.env.IDP_ISSUER = 'https://fake-issuer.local';
process.env.IDP_AUDIENCE = 'frotas-api';
process.env.IDP_JWKS_URL = 'https://fake-issuer.local/jwks.json';

import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});

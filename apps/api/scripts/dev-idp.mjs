// Fake OIDC issuer for LOCAL DEV ONLY. Serves a JWKS and mints RS256 tokens so
// you can exercise the auth flow (M0-F01) with a REST client, using the SAME
// jose+JWKS verification the API runs in prod. Never use this in a real env.
import { createServer } from 'node:http';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

const PORT = Number(process.env.DEV_IDP_PORT ?? 9999);
const ISSUER = process.env.DEV_IDP_ISSUER ?? `http://localhost:${PORT}`;
const AUDIENCE = process.env.DEV_IDP_AUDIENCE ?? 'frotas-api';

const { publicKey, privateKey } = await generateKeyPair('RS256', {
  extractable: true,
});
const jwk = await exportJWK(publicKey);
jwk.kid = 'dev-key';
jwk.alg = 'RS256';
jwk.use = 'sig';

const json = (res, code, body) => {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/.well-known/jwks.json') {
    return json(res, 200, { keys: [jwk] });
  }

  // GET /token?sub=&aud=&iss= — overrides let you forge wrong aud/iss (AC2).
  if (url.pathname === '/token') {
    const sub = url.searchParams.get('sub') ?? 'dev-sub-gestor';
    const aud = url.searchParams.get('aud') ?? AUDIENCE;
    const iss = url.searchParams.get('iss') ?? ISSUER;
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'dev-key' })
      .setSubject(sub)
      .setIssuer(iss)
      .setAudience(aud)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
    return json(res, 200, { token, sub, iss, aud });
  }

  return json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`dev-idp (fake OIDC) on http://localhost:${PORT}`);
  console.log(`  JWKS:  http://localhost:${PORT}/.well-known/jwks.json`);
  console.log(`  token: http://localhost:${PORT}/token?sub=dev-sub-gestor`);
});

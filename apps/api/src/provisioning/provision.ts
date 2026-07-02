import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import { ProvisionTenant } from '@frotas/domain';
import { ProvisioningModule } from './provisioning.module';

// Ops CLI for M0-F02 (there is no self-service screen nor platform-operator
// auth yet, so provisioning is deliberately NOT exposed over HTTP).
// Usage: pnpm --filter api provision -- --slug lages --name "Prefeitura de Lages"
//          --cpf 12345678901 --email admin@lages.gov.br --admin-name "Fulana"
//          [--auth-sub <idp-sub>]

// Same env loading as main.ts, with a fallback to the repo root .env when the
// CLI runs from apps/api (the usual pnpm --filter cwd).
try {
  process.loadEnvFile();
} catch {
  try {
    process.loadEnvFile('../../.env');
  } catch {
    // env already provided by the shell.
  }
}

interface CliOptions {
  slug: string;
  name: string;
  cpf: string;
  email: string;
  adminName: string;
  authSub?: string;
}

function readOptions(): CliOptions {
  // pnpm forwards the `--` separator as a literal argument; drop it so
  // parseArgs does not treat everything after it as positionals.
  const args = process.argv.slice(2);
  if (args[0] === '--') {
    args.shift();
  }
  const { values } = parseArgs({
    args,
    options: {
      slug: { type: 'string' },
      name: { type: 'string' },
      cpf: { type: 'string' },
      email: { type: 'string' },
      'admin-name': { type: 'string' },
      'auth-sub': { type: 'string' },
    },
  });
  const missing = ['slug', 'name', 'cpf', 'email', 'admin-name'].filter(
    (key) => !values[key as keyof typeof values],
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required options: ${missing.map((m) => `--${m}`).join(', ')}`,
    );
  }
  return {
    slug: values.slug!,
    name: values.name!,
    cpf: values.cpf!,
    email: values.email!,
    adminName: values['admin-name']!,
    authSub: values['auth-sub'],
  };
}

async function main(): Promise<void> {
  const options = readOptions();
  const app = await NestFactory.createApplicationContext(ProvisioningModule, {
    logger: ['warn', 'error'],
  });
  try {
    const provisionTenant = app.get(ProvisionTenant);
    const result = await provisionTenant.execute({
      slug: options.slug,
      name: options.name,
      admin: {
        cpf: options.cpf,
        email: options.email,
        name: options.adminName,
        authSub: options.authSub ?? null,
      },
    });
    console.log(
      `Tenant provisioned: ${options.slug} -> schema ${result.schemaName} ` +
        `(tenant ${result.tenantId}, admin identity ${result.adminIdentityId})`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

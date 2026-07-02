import { createPrismaClient } from "./index.js";
import { seedDemoData } from "./seed-demo.js";

// Prisma 7 does not auto-load .env.
try {
  process.loadEnvFile();
} catch {
  // env already provided by the shell — ignore.
}

// Dev IdP subject: matches the `sub` of the token issued by the local fake OIDC
// issuer. In prod this is the Cognito `sub` stored on Identity.authSub.
const DEV_SUB = "dev-sub-gestor";

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  try {
    await seedDemoData(prisma, {
      authSub: DEV_SUB,
      cpf: "11111111111",
      email: "gestor@demo.gov.br",
      name: "Gestor Demo",
    });
    console.log(
      'Seed ok: identity "gestor@demo.gov.br" (member of prefdemo), ' +
        "tenants prefdemo + prefdemo2 provisioned with vehicles.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

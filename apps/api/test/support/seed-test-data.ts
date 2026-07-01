import { createPrismaClient, seedDemoData, type SeededDemo } from '@frotas/db';

export type SeededData = SeededDemo;

/**
 * Deterministic control-plane + tenant data for the auth e2e. Delegates to the
 * shared `seedDemoData` (in @frotas/db) so the fixture never drifts from the dev
 * seed; only the identity (authSub/cpf/email) is specific to the test.
 */
export async function seedTestData(): Promise<SeededData> {
  const prisma = createPrismaClient();
  try {
    return await seedDemoData(prisma, {
      authSub: 'idp-sub-e2e',
      cpf: '00000000191',
      email: 'e2e@demo.gov.br',
      name: 'E2E User',
    });
  } finally {
    await prisma.$disconnect();
  }
}

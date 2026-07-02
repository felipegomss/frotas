import { Prisma } from '@frotas/db';

/** Shape of `error.meta` that the pg driver adapter attaches to a raw-query failure. */
interface DriverAdapterErrorMeta {
  driverAdapterError?: {
    cause?: {
      originalCode?: string;
    };
  };
}

// SQLSTATEs — stable across Postgres/driver versions.
export const POSTGRES_UNIQUE_VIOLATION = '23505';
export const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';

/** True when a raw query failed on the Postgres error identified by `sqlState`. */
export function isPostgresError(error: unknown, sqlState: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2010') return false;
  const meta = error.meta as DriverAdapterErrorMeta | undefined;
  return meta?.driverAdapterError?.cause?.originalCode === sqlState;
}

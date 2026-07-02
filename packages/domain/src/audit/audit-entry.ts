/**
 * One auditable fact, before it is chained (ADR 0012). Timestamps are ISO-8601
 * strings so the hash input is unambiguous across runtimes and storage.
 */
export interface AuditEntry {
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  createdAt: string;
}

/**
 * A chained audit record as persisted in the per-tenant `audit_log` (ADR 0012):
 * the genesis record has a null prevHash; every other record carries the hash
 * of its predecessor, so tampering with any row breaks the chain.
 */
export interface AuditRecord extends AuditEntry {
  prevHash: string | null;
  hash: string;
}

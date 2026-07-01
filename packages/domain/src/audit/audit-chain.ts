import { createHash } from "node:crypto";
import type { AuditEntry, AuditRecord } from "./audit-entry.js";

/**
 * Canonical serialization of an entry: a fixed-order tuple, so the hash never
 * depends on object key order or optional-field quirks.
 */
function canonical(entry: AuditEntry): string {
  return JSON.stringify([
    entry.actorId,
    entry.action,
    entry.entity,
    entry.entityId,
    entry.createdAt,
  ]);
}

/** sha256 over the previous hash + the canonical entry (ADR 0012). */
export function computeEntryHash(
  prevHash: string | null,
  entry: AuditEntry,
): string {
  return createHash("sha256")
    .update(`${prevHash ?? ""}\n${canonical(entry)}`)
    .digest("hex");
}

/** Chains an entry onto the previous record (null previous = genesis). */
export function chainEntry(
  prev: AuditRecord | null,
  entry: AuditEntry,
): AuditRecord {
  const prevHash = prev?.hash ?? null;
  return { ...entry, prevHash, hash: computeEntryHash(prevHash, entry) };
}

export type ChainVerification =
  { valid: true } | { valid: false; brokenAt: number };

/**
 * Verifies a chain in storage order: the genesis must have a null prevHash,
 * every record must link to its predecessor's hash, and every hash must match
 * its recomputation. Returns the index of the first broken record.
 */
export function verifyChain(records: AuditRecord[]): ChainVerification {
  let expectedPrev: string | null = null;
  for (const [i, record] of records.entries()) {
    if (record.prevHash !== expectedPrev) {
      return { valid: false, brokenAt: i };
    }
    if (record.hash !== computeEntryHash(record.prevHash, record)) {
      return { valid: false, brokenAt: i };
    }
    expectedPrev = record.hash;
  }
  return { valid: true };
}

import { describe, expect, it } from "vitest";
import { chainEntry, computeEntryHash, verifyChain } from "./audit-chain.js";
import type { AuditEntry, AuditRecord } from "./audit-entry.js";

const entry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  actorId: "actor-1",
  action: "tenant.provisioned",
  entity: "tenant",
  entityId: "tenant-1",
  createdAt: "2026-07-01T12:00:00.000Z",
  ...overrides,
});

describe("audit hash chain", () => {
  it("genesis record has a null prevHash and a hash bound to the entry (AC3)", () => {
    const genesis = chainEntry(null, entry());

    expect(genesis.prevHash).toBeNull();
    expect(genesis.hash).toBe(computeEntryHash(null, entry()));
    expect(genesis.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("appending references the hash of the previous record (AC8)", () => {
    const first = chainEntry(null, entry());
    const second = chainEntry(first, entry({ action: "vehicle.created" }));

    expect(second.prevHash).toBe(first.hash);
    expect(second.hash).toBe(
      computeEntryHash(first.hash, entry({ action: "vehicle.created" })),
    );
    expect(second.hash).not.toBe(first.hash);
  });

  it("hash is deterministic and sensitive to every field", () => {
    expect(computeEntryHash(null, entry())).toBe(
      computeEntryHash(null, entry()),
    );
    expect(computeEntryHash(null, entry({ actorId: null }))).not.toBe(
      computeEntryHash(null, entry()),
    );
    expect(computeEntryHash(null, entry({ entityId: "other" }))).not.toBe(
      computeEntryHash(null, entry()),
    );
    expect(
      computeEntryHash(null, entry({ createdAt: "2026-07-02T00:00:00.000Z" })),
    ).not.toBe(computeEntryHash(null, entry()));
    expect(computeEntryHash("abc", entry())).not.toBe(
      computeEntryHash(null, entry()),
    );
  });

  it("verifies an intact chain (AC3/AC8)", () => {
    const first = chainEntry(null, entry());
    const second = chainEntry(first, entry({ action: "vehicle.created" }));
    const third = chainEntry(second, entry({ action: "vehicle.updated" }));

    expect(verifyChain([])).toEqual({ valid: true });
    expect(verifyChain([first, second, third])).toEqual({ valid: true });
  });

  it("detects a tampered record payload (AC8)", () => {
    const first = chainEntry(null, entry());
    const second = chainEntry(first, entry({ action: "vehicle.created" }));
    const tampered: AuditRecord = { ...second, action: "vehicle.deleted" };

    expect(verifyChain([first, tampered])).toEqual({
      valid: false,
      brokenAt: 1,
    });
  });

  it("detects a broken link between records (AC8)", () => {
    const first = chainEntry(null, entry());
    const second = chainEntry(first, entry({ action: "vehicle.created" }));
    const relinked: AuditRecord = {
      ...second,
      prevHash: "0".repeat(64),
      hash: computeEntryHash("0".repeat(64), second),
    };

    expect(verifyChain([first, relinked])).toEqual({
      valid: false,
      brokenAt: 1,
    });
  });

  it("rejects a genesis record that claims a previous hash", () => {
    const first = chainEntry(null, entry());
    const fakeGenesis: AuditRecord = {
      ...entry(),
      prevHash: first.hash,
      hash: computeEntryHash(first.hash, entry()),
    };

    expect(verifyChain([fakeGenesis])).toEqual({ valid: false, brokenAt: 0 });
  });
});

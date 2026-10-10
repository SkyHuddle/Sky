import { createHash, randomBytes, randomUUID } from "node:crypto";

export const newId = (): string => randomUUID();

/** URL-safe invite code without ambiguous characters (no 0/O/1/l/I). */
export function newInviteCode(length = 10): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");

/** Stable hash of any JSON-serialisable value (sorted keys), used for idempotency. */
export function stableHash(value: unknown): string {
  return sha256(stableStringify(value));
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(",")}}`;
}

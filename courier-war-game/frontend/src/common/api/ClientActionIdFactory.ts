// this file creates safe client action ids and idempotency keys for backend mutations

let clientActionCounter = 0;

function safePrefixGet(prefix: string): string {
  // this keeps key characters inside backend allowed regex
  return prefix.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 18) || "cw";
}

function randomPartGet(): string {
  // this uses browser crypto when available
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }

  // this fallback is only for older browsers
  return Math.random().toString(36).slice(2, 18);
}

export function clientActionIdCreate(prefix: string): string {
  // this increments per tab so rapid actions do not reuse same key
  clientActionCounter += 1;

  // this keeps id inside backend 8 to 64 char limits
  return `${safePrefixGet(prefix)}_${Date.now().toString(36)}_${clientActionCounter}_${randomPartGet()}`.slice(0, 64);
}
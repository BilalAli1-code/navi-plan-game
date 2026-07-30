/**
 * API-layer Idempotency-Key fingerprinting.
 *
 * Application idempotency is keyed by commandId. The HTTP Idempotency-Key must
 * match commandId for this slice. Changing the payload under the same key is a
 * 409 conflict — detected here before Application processing.
 */

export interface IdempotencyFingerprintStore {
  rememberOrConflict(
    tenantId: string,
    idempotencyKey: string,
    fingerprint: string,
  ): "ok" | "conflict";
}

export const createInMemoryIdempotencyFingerprintStore =
  (): IdempotencyFingerprintStore => {
    const map = new Map<string, string>();
    return {
      rememberOrConflict(tenantId, idempotencyKey, fingerprint) {
        const key = `${tenantId}:${idempotencyKey}`;
        const existing = map.get(key);
        if (existing === undefined) {
          map.set(key, fingerprint);
          return "ok";
        }
        return existing === fingerprint ? "ok" : "conflict";
      },
    };
  };

export const fingerprintSubmitDecisionBody = (body: unknown): string =>
  JSON.stringify(body);

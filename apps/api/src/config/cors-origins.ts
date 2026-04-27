/**
 * CORS: either allow any origin, or a comma-separated allowlist.
 * Read at process boot (HTTP + WebSocket) — not hot-reloadable.
 *
 * CORS_ALLOW_ALL: true/1/yes → allow all
 * else: CORS_ORIGIN = comma-separated URLs (empty = no browser origins; API still works server-to-server)
 * Legacy: CORS_ORIGIN=* is treated as allow all if CORS_ALLOW_ALL is unset
 */
export function getCorsOriginValue(): true | string[] {
  const allowAllFlag = (process.env.CORS_ALLOW_ALL ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(allowAllFlag)) {
    return true;
  }

  const raw = (process.env.CORS_ORIGIN ?? '').trim();
  if (raw === '*' && allowAllFlag === '') {
    return true;
  }
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function describeCorsMode(): string {
  const v = getCorsOriginValue();
  if (v === true) return 'allow all origins';
  if (v.length === 0) return 'no origins in allowlist (only non-browser or same-origin clients)';
  return `restricted to ${v.length} origin(s)`;
}

// Shared Web API handler, executable in Deno and in the local Node test harness.
export const OWNER_ID = '4dde6af0-2fd6-4520-86a7-8241acb9c180';
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const ownerActions = new Set(['create-invitation', 'list-invitations', 'revoke-invitation']);
const actions = new Set([...ownerActions, 'redeem-invitation', 'validate-room-session', 'revoke-room-session']);

export function generateToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
export async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('input');
  // Enforce actual streamed bytes, not just a caller-controlled Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new Error('input');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new Error('input'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('input');
  return body;
}

export function createHandler({ action, siteOrigin, getUser, rpc }) {
  // An explicit canonical origin prevents Host/Origin header injection into links.
  const origin = new URL(siteOrigin).origin;
  if (origin !== siteOrigin || (!siteOrigin.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(siteOrigin))) {
    throw new Error('Invalid ROOM_SITE_ORIGIN');
  }
  return async request => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer', 'Vary': 'Origin',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.headers.get('origin') && request.headers.get('origin') !== origin) return reply({ error: 'unavailable' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
    if (!actions.has(action)) return reply({ error: 'unavailable' }, 404);
    let body;
    try { body = await readBody(request); } catch { return reply({ error: 'invalid_request' }, 400); }
    try {
      if (ownerActions.has(action)) {
        const bearer = request.headers.get('authorization');
        if (!bearer?.startsWith('Bearer ') || bearer.length > 8192) return reply({ error: 'unauthorized' }, 401);
        // Auth server validation, never decode-and-trust JWT claims or body isOwner.
        const user = await getUser(bearer.slice(7));
        if (!user) return reply({ error: 'unauthorized' }, 401);
        if (user.id !== OWNER_ID) return reply({ error: 'forbidden' }, 403);
      }
      if (action === 'create-invitation') {
        const token = generateToken();
        const invitation = await rpc('room_create_invitation', { p_token_hash: await hashToken(token), p_owner: OWNER_ID });
        return reply({ ...invitation, invitation_url: `${origin}/room/invite#${token}` }, 201);
      }
      if (action === 'list-invitations') return reply({ invitations: await rpc('room_list_invitations', {}) });
      if (action === 'revoke-invitation') {
        if (typeof body.id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.id)) return reply({ error: 'invalid_request' }, 400);
        return reply(await rpc('room_revoke_invitation', { p_id: body.id }));
      }
      if (typeof body.token !== 'string' || !TOKEN_PATTERN.test(body.token)) return reply({ error: 'unavailable' }, 400);
      const hash = await hashToken(body.token);
      if (action === 'redeem-invitation') {
        const token = generateToken();
        const result = await rpc('room_redeem_invitation', { p_token_hash: hash, p_session_hash: await hashToken(token) });
        if (result.status !== 'ok') return reply({ error: ['already_used', 'expired'].includes(result.status) ? result.status : 'unavailable' }, 409);
        return reply({ token, expires_at: result.expires_at });
      }
      return reply(await rpc(action === 'validate-room-session' ? 'room_validate_session' : 'room_revoke_session', { p_session_hash: hash }));
    } catch {
      // Deliberately do not log request bodies, auth headers, SDK errors or tokens.
      return reply({ error: 'temporarily_unavailable' }, 503);
    }
  };
}

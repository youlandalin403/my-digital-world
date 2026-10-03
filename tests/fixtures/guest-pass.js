export const visitToken = 'A'.repeat(43);
export const invitationToken = 'B'.repeat(42) + 'A';
export const sessionKey = 'my-room-visit-v07';
export async function installGuestPass(page, { seed = false } = {}) {
  const state = { valid: true, redeemed: false, calls: [], expires: Date.now() + 14400000,
    failLeave: false, failValidate: false, invitationStatus: 'unused' };
  if (seed) await page.addInitScript(({ sessionKey, visitToken }) => {
    if (!sessionStorage.getItem(sessionKey)) sessionStorage.setItem(sessionKey, visitToken);
  }, { sessionKey, visitToken });
  await page.route('https://observatory.test/functions/v1/**', async route => {
    const action = new URL(route.request().url()).pathname.split('/').pop();
    const body = route.request().postDataJSON(); state.calls.push({ action, body });
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    const expires_at = new Date(state.expires).toISOString();
    if (action === 'redeem-invitation') {
      if (state.redeemed) return reply({ error: 'already_used' }, 409);
      if (body.token !== invitationToken || state.invitationStatus === 'revoked') return reply({ error: 'unavailable' }, 409);
      if (state.invitationStatus === 'expired') return reply({ error: 'expired' }, 409);
      state.redeemed = true; return reply({ token: visitToken, expires_at });
    }
    if (action === 'validate-room-session') return state.failValidate ? reply({}, 503) : reply({ valid: state.valid && body.token === visitToken, expires_at });
    if (action === 'revoke-room-session') {
      if (state.failLeave) return reply({}, 503);
      state.valid = false; return reply({ ok: true });
    }
    if (!route.request().headers().authorization?.startsWith('Bearer ')) return reply({ error: 'unauthorized' }, 401);
    if (action === 'create-invitation') return reply({ invitation_url: `${new URL(page.url()).origin}/room/invite#${invitationToken}` }, 201);
    if (action === 'revoke-invitation') { state.invitationStatus = 'revoked'; return reply({ ok: true }); }
    if (action === 'list-invitations') return reply({ invitations: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      created_at: new Date().toISOString(), expires_at, status: state.invitationStatus }] });
    return reply({}, 404);
  });
  return state;
}

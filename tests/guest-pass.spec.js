import { test, expect } from '@playwright/test';
import { installGuestPass, invitationToken, visitToken, sessionKey } from './fixtures/guest-pass';
test.setTimeout(60000);
test.beforeEach(async ({ page }) => {
  // Never contact a real Supabase project, even on unexpected code paths.
  await page.route('https://observatory.test/**', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
});
test('preview is inert; explicit click redeems once, fragment is removed, refresh validates and Leave revokes', async ({ page }) => {
  const state = await installGuestPass(page);
  await page.goto(`/room/invite#${invitationToken}`);
  await expect(page.getByRole('button', { name: 'Enter My Room' })).toBeVisible();
  expect(state.calls).toEqual([]);
  expect(await page.evaluate(() => Object.values(localStorage))).not.toContain(invitationToken);
  await page.getByRole('button', { name: 'Enter My Room' }).dblclick();
  await expect(page).toHaveURL(/\/room$/);
  await expect(page.getByRole('button', { name: 'Enter Room', exact: true })).toBeVisible();
  expect(state.calls.filter(c => c.action === 'redeem-invitation')).toHaveLength(1);
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe(visitToken);
  expect(await page.evaluate(() => Object.values(localStorage))).not.toContain(visitToken);
  const validations = state.calls.filter(c => c.action === 'validate-room-session').length;
  await page.reload(); await expect(page.getByRole('button', { name: 'Leave Room' })).toBeVisible();
  expect(state.calls.filter(c => c.action === 'validate-room-session').length).toBeGreaterThan(validations);
  await page.getByRole('button', { name: 'Leave Room' }).click();
  await expect(page.getByText('My Room is locked.', { exact: false })).toBeVisible();
  expect(state.valid).toBe(false); expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe(null);
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.goto(`/room/invite#${invitationToken}`); await page.getByRole('button', { name: 'Enter My Room' }).click();
  await expect(page.getByRole('alert')).toHaveText('This invitation has already been used.');
});
test('both entrance routes lock without a server-valid visit; string presence is insufficient', async ({ page }) => {
  const state = await installGuestPass(page);
  for (const path of ['/room', '/my-room']) {
    await page.goto(path); await expect(page.getByText('My Room is locked.', { exact: false })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  }
  state.valid = false;
  await page.evaluate(({ sessionKey, visitToken }) => sessionStorage.setItem(sessionKey, visitToken), { sessionKey, visitToken });
  await page.reload(); await expect(page.getByRole('alert')).toContainText('visit has ended');
  await expect(page.locator('canvas')).toHaveCount(0);
});
test('server invalidation on focus locks the room and clears the visit', async ({ page }) => {
  const state = await installGuestPass(page, { seed: true });
  await page.goto('/room'); await expect(page.getByRole('button', { name: 'Leave Room' })).toBeVisible();
  state.valid = false; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('alert')).toContainText('visit has ended');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe(null);
});
test('server expiry closes an open visit without a refresh', async ({ page }) => {
  const state = await installGuestPass(page, { seed: true }); state.expires = Date.now() + 4000;
  await page.goto('/room'); await expect(page.getByRole('button', { name: 'Leave Room' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('visit has expired', { timeout: 10000 });
  await expect(page.locator('canvas')).toHaveCount(0);
});
test('revocation failure still closes access and supports a retry', async ({ page }) => {
  const state = await installGuestPass(page, { seed: true }); state.failLeave = true;
  await page.goto('/room'); await page.getByRole('button', { name: 'Leave Room' }).click();
  await expect(page.getByRole('alert')).toContainText('server revocation failed');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(key => sessionStorage.getItem(key), sessionKey)).toBe(null);
  state.failLeave = false; await page.getByRole('button', { name: 'Retry ending visit' }).click();
  await expect(page.getByRole('button', { name: 'Retry ending visit' })).toHaveCount(0); expect(state.valid).toBe(false);
});
test('unavailable validation never unlocks; unavailable tab storage never consumes an invitation', async ({ page }) => {
  const state = await installGuestPass(page, { seed: true }); state.failValidate = true;
  await page.goto('/room'); await expect(page.getByRole('alert')).toContainText('Unable to validate');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.goto(`/room/invite#${invitationToken}`);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('disabled'); }; });
  await page.getByRole('button', { name: 'Enter My Room' }).click();
  await expect(page.getByRole('alert')).toContainText('Enable browser session storage');
  expect(state.calls.filter(c => c.action === 'redeem-invitation')).toHaveLength(0);
});
test('owner enters without Guest Pass, generates a link once, lists metadata and revokes', async ({ page }) => {
  const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180';
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.test`;
  await page.route('https://observatory.test/auth/v1/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ access_token: token, refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600, user }) }));
  const state = await installGuestPass(page);
  await page.goto('/room'); await page.getByLabel('Email', { exact: true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enter Room', exact: true })).toBeVisible();
  await page.getByText('Manage Guest Pass invitations', { exact: true }).click();
  await page.getByRole('button', { name: 'Generate Invitation' }).click();
  await expect(page.getByLabel('New invitation link')).toHaveValue(new RegExp(`/room/invite#${invitationToken}$`));
  await page.getByRole('button', { name: 'Dismiss link' }).click();
  await page.getByRole('button', { name: 'Refresh invitations' }).click();
  await expect(page.getByLabel('New invitation link')).toHaveCount(0);
  await page.getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Guest Pass invitations' })).toContainText('revoked');
  expect(state.calls.filter(c => c.action === 'validate-room-session')).toHaveLength(0);
});

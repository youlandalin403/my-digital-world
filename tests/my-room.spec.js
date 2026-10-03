import { test, expect } from '@playwright/test';
import { installGuestPass } from './fixtures/guest-pass';
const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180';
async function backend(page, guest = true) {
  const rows = new Map(), messages = []; let reads = 0, failRead = false, failWrite = false;
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.test`;
  await page.route('https://observatory.test/**', async route => {
    const req = route.request(), url = new URL(req.url());
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname.includes('/auth/v1/token')) return reply({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user });
    if (url.pathname.includes('/auth/v1/user')) return reply(user);
    if (url.pathname.includes('/auth/v1/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/guestbook_entries')) {
      if (req.method() === 'POST') {
        const entry = { ...req.postDataJSON(), id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', created_at: new Date().toISOString(), is_hidden: false };
        messages.push(entry); return reply(entry, 201);
      }
      return reply(messages);
    }
    if (!url.pathname.endsWith('/diary_entries')) return reply({}, 404);
    reads++;
    if (req.headers().authorization !== `Bearer ${token}`) return reply({ message: 'Denied' }, 403);
    if (req.method() === 'GET') return failRead ? reply({ message: 'Missing table' }, 404) : reply(rows.has(url.searchParams.get('date').slice(3)) ? [rows.get(url.searchParams.get('date').slice(3))] : []);
    if (failWrite) return reply({ message: 'Offline' }, 503);
    const entry = req.postDataJSON(); rows.set(entry.date, entry); return reply(entry, 201);
  });
  await installGuestPass(page, { seed: guest });
  return { rows, reads: () => reads, failReads: value => { failRead = value; }, failWrites: value => { failWrite = value; } };
}
async function login(page) {
  await page.getByLabel('Email', { exact: true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

// These tests use real browser pointer lock and keyboard input. Deterministic aim
// dispatches mouse movement events, never changes camera state or calls actions.
test.setTimeout(60000);
async function pose(page) {
  return page.locator('canvas').evaluate(el => ({ position: el.dataset.position.split(',').map(Number), look: el.dataset.look.split(',').map(Number) }));
}
async function enter(page) {
  await page.getByRole('button', { name: 'Enter Room', exact: true }).click();
  await expect(page.locator('.room-scene')).toHaveAttribute('data-locked', 'true');
  expect(await page.evaluate(() => document.pointerLockElement?.tagName)).toBe('CANVAS');
}
async function aimAngles(page, yaw, pitch = 0) {
  const current = await pose(page);
  await page.evaluate(({ x, y }) => document.dispatchEvent(new MouseEvent('mousemove', { movementX: x, movementY: y })), { x: Math.round((current.look[1] - yaw) / .002), y: Math.round((current.look[0] - pitch) / .002) });
  await page.waitForTimeout(50);
}
async function aimAt(page, target) {
  const { position: p } = await pose(page);
  const dx = target[0]-p[0], dy = target[1]-p[1], dz = target[2]-p[2];
  await aimAngles(page, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx,dz)));
}
async function walkAxis(page, axis, target) {
  await aimAngles(page, 0);
  const current = (await pose(page)).position[axis], positive = target > current;
  if (Math.abs(target-current) < .06) return;
  const key = axis === 0 ? (positive ? 'd' : 'a') : (positive ? 's' : 'w');
  await page.keyboard.down(key);
  try { await expect.poll(async () => { const value = (await pose(page)).position[axis]; return positive ? value >= target-.04 : value <= target+.04; }, { timeout: 7000, intervals: [25] }).toBe(true); }
  finally { await page.keyboard.up(key); }
}
async function approach(page, id) {
  // Approach each relocated object via the unobstructed central aisle.
  await walkAxis(page, 0, 0);
  await walkAxis(page, 2, id === 'tea' ? -1.05 : id === 'guestbook' ? -.2 : .35);
  await walkAxis(page, 0, id === 'guestbook' ? -1.6 : 1.4);
  await aimAt(page, id === 'tea' ? [2.2,.88,-.95] : id === 'guestbook' ? [-2.96,1.6,-.2] : [2.2,.815,.05]);
  await expect(page.locator('.room-prompt')).toHaveText(id === 'diary' ? /^\[E\] (Open diary|Diary is locked)$/ : `[E] ${id === 'tea' ? 'Drink tea' : 'Read guestbook'}`);
}
async function openDiary(page) {
  await enter(page); await approach(page, 'diary'); await page.keyboard.press('e');
  await expect(page.getByRole('dialog', { name: 'Private Diary' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Ready');
}

test('native first-person controls, distance/focus gate, tea, Esc and boundaries', async ({ page }) => {
  await backend(page); await page.goto('/my-room'); await enter(page);
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mousemove', { movementX: 0, movementY: 0 })));
  await page.waitForTimeout(50);
  await aimAngles(page, 0);
  await page.screenshot({ path: 'review/my-room-v03-entry.png' });
  await aimAt(page, [2.2,.88,-.95]); await expect(page.locator('.room-prompt')).toHaveCount(0);
  await page.keyboard.press('e'); await expect(page.getByTestId('tea-state')).toHaveText('The tea is still warm.');
  const before = await pose(page); await page.mouse.move(600,400); await page.mouse.move(650,420);
  await expect.poll(async () => (await pose(page)).look.join(',')).not.toBe(before.look.join(','));
  await approach(page, 'tea');
  await aimAngles(page, Math.PI/2); await expect(page.locator('.room-prompt')).toHaveCount(0); await page.keyboard.press('e');
  await expect(page.getByTestId('tea-state')).toHaveText('The tea is still warm.');
  await aimAt(page, [2.2,.88,-.95]); await expect(page.locator('.room-prompt')).toHaveText('[E] Drink tea');
  await page.keyboard.down('e'); await page.keyboard.down('e'); await page.keyboard.up('e');
  await expect(page.getByTestId('tea-state')).toHaveText('Half a cup left.');
  await page.keyboard.press('e'); await expect(page.getByTestId('tea-state')).toHaveText('The cup is empty.');
  await page.keyboard.press('e'); await expect(page.getByTestId('tea-state')).toHaveText('The cup is empty.');
  await page.screenshot({ path: 'review/my-room-v03-tea.png' });
  await page.keyboard.press('Escape'); await expect(page.locator('.room-scene')).toHaveAttribute('data-locked','false');
  const paused = await pose(page); await page.keyboard.down('w'); await page.waitForTimeout(150); await page.keyboard.up('w'); expect(await pose(page)).toEqual(paused);
  await enter(page); await walkAxis(page,0,0); await walkAxis(page,2,.35); await aimAngles(page,0);
  await page.keyboard.down('w'); await page.waitForTimeout(2500); await page.keyboard.up('w');
  const wall = (await pose(page)).position; expect(wall[2]).toBeCloseTo(-2.28,2); expect(wall[1]).toBe(1.65);
  await page.keyboard.press('Escape'); await page.reload(); await expect(page.getByTestId('tea-state')).toHaveText('The tea is still warm.');
});

test('Guestbook modal pauses input and preserves exact room state; visitor cannot open Diary', async ({ page }) => {
  const server = await backend(page); await page.goto('/my-room'); await enter(page); await approach(page,'guestbook');
  const before = await pose(page); await page.keyboard.press('e');
  await expect(page.getByRole('dialog', { name: 'Guestbook', exact: true })).toBeVisible();
  await expect(page.locator('.room-scene')).toHaveAttribute('data-locked','false');
  expect(await page.evaluate(() => document.pointerLockElement)).toBe(null);
  await page.getByLabel('Message', { exact: true }).fill('WASD and E are normal text here.');
  await page.keyboard.press('w'); await page.waitForTimeout(200); expect(await pose(page)).toEqual(before);
  await page.getByRole('button', { name: 'Leave a message', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Your public message was posted.');
  await expect(page.getByRole('region', { name: 'Recent messages' })).toContainText('WASD and E are normal text here.');
  await page.screenshot({ path: 'review/my-room-v03-guestbook.png' });
  await page.getByRole('button', { name: 'Return to room' }).click(); expect(await pose(page)).toEqual(before);
  await expect(page.getByRole('button', { name: 'Enter Room', exact: true })).toBeFocused();
  await enter(page); await approach(page,'diary'); await page.keyboard.press('e');
  await expect(page.locator('.room-prompt')).toHaveText('[E] Diary is locked');
  await expect(page.locator('.room-feedback')).toContainText('Diary is private'); expect(server.reads()).toBe(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('owner Diary save, refresh, dates, failure recovery, overlay continuity and logout', async ({ page }) => {
  const server = await backend(page, false); await page.goto('/my-room'); await login(page); await openDiary(page);
  const initial = await pose(page);
  await page.getByLabel('Date', { exact: true }).fill('2026-09-28'); await expect(page.getByRole('status')).toHaveText('Ready');
  await page.getByLabel('Title (optional)').fill('Private'); await page.getByLabel('Markdown').fill('# My day\n\nFree writing.');
  server.failWrites(true); await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not saved'); await expect(page.getByLabel('Markdown')).toHaveValue('# My day\n\nFree writing.');
  server.failWrites(false); await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Saved');
  expect(await pose(page)).toEqual(initial);
  await page.getByRole('button', { name: 'Return to room' }).click(); expect(await pose(page)).toEqual(initial);
  await page.reload(); await openDiary(page);
  await page.getByLabel('Date', { exact: true }).fill('2026-09-28');
  await expect(page.getByLabel('Markdown')).toHaveValue('# My day\n\nFree writing.');
  await page.getByRole('button', { name: 'Previous day' }).click(); await expect(page.getByLabel('Markdown')).toHaveValue('');
  await page.getByRole('button', { name: 'Next day' }).click(); await expect(page.getByLabel('Title (optional)')).toHaveValue('Private');
  await page.getByLabel('Markdown').fill('unsaved'); page.once('dialog', d => d.dismiss()); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Private Diary' })).toBeVisible(); await expect(page.getByLabel('Markdown')).toHaveValue('unsaved');
  page.once('dialog', d => d.dismiss()); await page.getByRole('button', { name: 'Previous day' }).click(); await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2026-09-28');
  page.once('dialog', d => d.accept()); server.failReads(true); await page.getByRole('button', { name: 'Previous day' }).click();
  await expect(page.getByRole('alert')).toContainText('migration may not be applied'); await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  server.failReads(false); await page.getByRole('button', { name: 'Retry loading Diary' }).click(); await expect(page.getByRole('status')).toHaveText('Ready');
  await page.getByRole('button', { name: 'Today', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Ready');
  await page.screenshot({ path: 'review/my-room-v03-diary.png' });
  await page.getByRole('button', { name: 'Return to room' }).click(); await page.getByRole('button', { name: 'Sign out' }).click();
  const reads = server.reads(); await expect(page.getByText('My Room is locked.', { exact: false })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(server.reads()).toBe(reads); await expect(page.getByLabel('Markdown')).toHaveCount(0);
});

test('pointer lock failure is recoverable and grants no movement or remote interaction', async ({ page }) => {
  await backend(page); await page.goto('/my-room');
  await page.locator('canvas').evaluate(el => { el.requestPointerLock = () => Promise.reject(new Error('Denied')); });
  await page.getByRole('button', { name: 'Enter Room', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Mouse control was not granted');
  await expect(page.getByRole('button', { name: 'Enter Room', exact: true })).toBeEnabled();
  const initial = await pose(page); await page.keyboard.down('w'); await page.waitForTimeout(100); await page.keyboard.up('w');
  await page.keyboard.press('e'); expect(await pose(page)).toEqual(initial);
  await expect(page.getByTestId('tea-state')).toHaveText('The tea is still warm.');
});




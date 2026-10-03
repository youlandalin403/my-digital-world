import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/constellation.json', import.meta.url)));
const owner = fixture[0].owner_id;
// Intercept every request to the fake backend. No real Supabase database is touched.
async function backend(page) {
  const rows = structuredClone(fixture); let failRead = false, failWrite = false;
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`;
  await page.route('https://observatory.test/**', async route => {
    const req = route.request(), url = new URL(req.url());
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.includes('/auth/v1/token')) return reply({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user });
    if (url.pathname.includes('/auth/v1/user')) return reply(user);
    if (url.pathname.includes('/auth/v1/logout')) return route.fulfill({ status: 204 });
    if (req.method() === 'GET') return failRead ? reply({ message: 'Database not ready' }, 404) : reply(rows);
    if (failWrite || req.headers().authorization !== `Bearer ${token}`) return reply({ message: 'Write rejected' }, 403);
    const data = req.postDataJSON();
    const nextOrder = parent => Math.max(-1, ...rows.filter(n => n.parent_id === parent).map(n => n.sort_order)) + 1;
    if (url.pathname.endsWith('/rpc/add_constellation_node')) {
      const id = randomUUID();
      rows.push({ id, owner_id: owner, parent_id: data.target_parent, name: data.node_name, description: data.node_description, status: data.node_status, sort_order: nextOrder(data.target_parent) });
      return reply(id);
    }
    if (url.pathname.endsWith('/rpc/move_constellation_node')) {
      const node = rows.find(n => n.id === data.target_node); node.sort_order = nextOrder(data.target_parent); node.parent_id = data.target_parent;
      return reply(null);
    }
    if (url.pathname.endsWith('/rpc/reorder_constellation_nodes')) {
      data.node_ids.forEach((id, index) => { rows.find(n => n.id === id).sort_order = index; }); return reply(null);
    }
    const node = rows.find(n => `eq.${n.id}` === url.searchParams.get('id'));
    if (!node) return reply({ message: 'Unknown request' }, 400);
    if (req.method() === 'PATCH') Object.assign(node, data, { updated_at: new Date().toISOString() });
    if (req.method() === 'DELETE') rows.splice(rows.indexOf(node), 1);
    return reply(node);
  });
  return { rows, failReads: value => { failRead = value; }, failWrites: value => { failWrite = value; } };
}
const map = page => page.getByRole('region', { name: 'Interest map', exact: true });
const explore = (page, name) => page.getByRole('button', { name: `Explore ${name}`, exact: true });
const editor = page => page.getByRole('region', { name: 'Owner tree editor' });
async function login(page) {
  await page.getByRole('button', { name: 'Owner login' }).click();
  await page.getByLabel('Email', { exact: true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(editor(page)).toBeVisible();
}
async function saved(page) { await expect(page.getByRole('status')).toHaveText('Saved'); }

test('public progressive tree, path, keyboard, pan/zoom/home and stable refresh', async ({ page }) => {
  await backend(page); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/constellation');
  await expect(map(page).locator('[data-node]')).toHaveCount(11);
  await expect(editor(page)).toHaveCount(0);
  const initial = await map(page).locator('[data-node]').evaluateAll(nodes => nodes.map(n => [n.getAttribute('data-node'), n.getAttribute('transform')]));
  await explore(page, 'AI').click(); await expect(map(page).locator('[data-node]')).toHaveCount(18);
  await explore(page, 'Agents').focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Selected interest' })).toContainText('MY INTERESTS / AI / Agents');
  await expect(map(page).locator('.path-line')).toHaveCount(2);
  await explore(page, 'AI').click(); await expect(map(page).locator('[data-node]')).toHaveCount(11);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByTestId('map-transform')).toHaveAttribute('transform', /scale\(1.25\)/);
  const box = await map(page).locator('svg').boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down(); await page.mouse.move(box.x + 90, box.y + 50); await page.mouse.up();
  await expect(page.getByTestId('map-transform')).not.toHaveAttribute('transform', 'translate(0 0) scale(1.25)');
  await page.getByRole('button', { name: 'Home / reset' }).click();
  await expect(page.getByTestId('map-transform')).toHaveAttribute('transform', 'translate(0 0) scale(1)');
  await page.reload(); await expect(map(page).locator('[data-node]')).toHaveCount(11);
  expect(await map(page).locator('[data-node]').evaluateAll(nodes => nodes.map(n => [n.getAttribute('data-node'), n.getAttribute('transform')]))).toEqual(initial);
  await page.screenshot({ path: 'review/constellation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.locator('.constellation-page').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'review/constellation-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('owner edits persist after reload, invalid actions are unavailable, failed draft survives, logout hides editor', async ({ page }) => {
  const server = await backend(page); await page.goto('/constellation'); await login(page);
  await expect(editor(page).getByText('The root cannot be moved or deleted.')).toBeVisible();
  await expect(editor(page).getByRole('button', { name: 'Move node', exact: true })).toHaveCount(0);
  await editor(page).getByRole('button', { name: 'AI', exact: true }).click();
  await editor(page).getByRole('button', { name: 'Delete leaf' }).click();
  await expect(editor(page).getByRole('alert')).toHaveText('Move or delete the children first.');
  const options = await page.getByLabel('New parent', { exact: true }).locator('option').allTextContents();
  expect(options.length).toBeGreaterThan(1);
  expect(options.some(value => value === 'MY INTERESTS / AI' || value.startsWith('MY INTERESTS / AI /'))).toBe(false);
  await page.getByLabel('Child name', { exact: true }).fill('AI Safety');
  await page.getByLabel('Child status', { exact: true }).selectOption('exploring');
  await page.getByRole('button', { name: 'Add child', exact: true }).click(); await saved(page);
  await page.reload(); await expect(editor(page)).toBeVisible();
  await editor(page).getByRole('button', { name: 'Toggle editor AI', exact: true }).click();
  await editor(page).getByRole('button', { name: 'AI Safety', exact: true }).click();
  await expect(page.getByLabel('Edit status', { exact: true })).toHaveValue('exploring');
  await page.getByLabel('Edit description', { exact: true }).fill('A short description.');
  await page.getByLabel('Edit status', { exact: true }).selectOption('active');
  server.failWrites(true);
  await page.getByRole('button', { name: 'Save node' }).click();
  await expect(page.getByRole('alert')).toContainText('Write rejected');
  await expect(page.getByLabel('Edit description', { exact: true })).toHaveValue('A short description.');
  server.failWrites(false); await page.getByRole('button', { name: 'Save node' }).click(); await saved(page);
  const computing = server.rows.find(n => n.name === 'Computing').id;
  await page.getByLabel('New parent', { exact: true }).selectOption(computing);
  await page.getByRole('button', { name: 'Move node', exact: true }).click(); await saved(page);
  await page.getByRole('button', { name: 'Move sibling up' }).click(); await saved(page);
  const safety = server.rows.find(n => n.name === 'AI Safety');
  expect(safety.parent_id).toBe(computing); expect(safety.sort_order).toBe(5);
  await page.reload(); await expect(editor(page)).toBeVisible();
  await editor(page).getByRole('button', { name: 'Toggle editor Computing', exact: true }).click();
  await editor(page).getByRole('button', { name: 'AI Safety', exact: true }).click();
  await expect(page.getByLabel('Edit description', { exact: true })).toHaveValue('A short description.');
  await expect(page.getByLabel('Edit status', { exact: true })).toHaveValue('active');
  await page.screenshot({ path: 'review/constellation-editor.png', fullPage: true });
  page.once('dialog', dialog => dialog.dismiss()); await page.getByRole('button', { name: 'Delete leaf' }).click();
  expect(server.rows.some(n => n.id === safety.id)).toBe(true);
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Delete leaf' }).click(); await saved(page);
  expect(server.rows.some(n => n.id === safety.id)).toBe(false);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(editor(page)).toHaveCount(0); await expect(map(page).locator('[data-node]')).toHaveCount(11);
  await page.reload(); await expect(editor(page)).toHaveCount(0); await expect(map(page).locator('[data-node]')).toHaveCount(11);
});

test('missing migration is an explicit error with retry, never a seeded frontend fallback', async ({ page }) => {
  const server = await backend(page); server.failReads(true); await page.goto('/constellation');
  await expect(page.getByRole('alert')).toContainText('Database not ready'); await expect(map(page)).toHaveCount(0);
  server.failReads(false); await page.getByRole('button', { name: 'Reload tree' }).click();
  await expect(map(page).locator('[data-node]')).toHaveCount(11);
});

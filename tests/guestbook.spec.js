import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180';
async function backend(page) {
  const rows = [{ id: randomUUID(), name: 'Earlier visitor', message: 'Welcome!', is_hidden: false, created_at: '2026-09-01T10:00:00Z' }, { id: randomUUID(), name: 'Hidden visitor', message: 'Hidden note', is_hidden: true, created_at: '2026-09-02T10:00:00Z' }];
  let failRead = false, failWrite = false, posts = 0;
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.test`;
  await page.route('https://observatory.test/**', async route => {
    const req = route.request(), url = new URL(req.url());
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname.includes('/auth/v1/token')) return reply({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user });
    if (url.pathname.includes('/auth/v1/user')) return reply(user);
    if (url.pathname.includes('/auth/v1/logout')) return route.fulfill({ status: 204 });
    const authenticated = req.headers().authorization === `Bearer ${token}`;
    if (req.method() === 'GET') return failRead ? reply({ message: 'Unavailable' }, 404) : reply(rows.filter(n => (authenticated || !n.is_hidden) && (url.searchParams.get('is_hidden') !== 'eq.false' || !n.is_hidden)).sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id)));
    if (failWrite) return reply({ message: 'Write failed' }, 503);
    const data = req.postDataJSON();
    if (req.method() === 'POST') {
      posts++; expect(Object.keys(data).sort()).toEqual(['message','name']);
      const row = { ...data, id: randomUUID(), is_hidden: false, created_at: new Date().toISOString() }; rows.push(row); return reply(row, 201);
    }
    if (!authenticated) return reply({ message: 'Denied' }, 403);
    const row = rows.find(n => `eq.${n.id}` === url.searchParams.get('id'));
    if (req.method() === 'PATCH') Object.assign(row, data);
    if (req.method() === 'DELETE') rows.splice(rows.indexOf(row),1);
    return reply(row);
  });
  return { rows, posts: () => posts, failReads: value => { failRead = value; }, failWrites: value => { failWrite = value; } };
}
async function login(page) {
  await page.getByRole('button', { name: 'Owner login' }).click();
  await page.getByLabel('Email', { exact: true }).fill('owner@example.test'); await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unhide', exact: true })).toBeVisible();
}

test('public submissions, limits, cooldown, literal text, persistence and email', async ({ page }) => {
  const server = await backend(page); await page.goto('/guestbook');
  await expect(page.getByText('Welcome!', { exact: true })).toBeVisible(); await expect(page.getByText('Hidden note', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hide', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Send me an email.' })).toHaveAttribute('href', 'mailto:contact@example.test');
  const message = page.getByLabel('Message', { exact: true }), submit = page.getByRole('button', { name: 'Leave a message', exact: true });
  await message.fill('   '); await submit.click(); await expect(page.getByRole('alert')).toContainText('enter a message'); expect(server.posts()).toBe(0);
  await expect(page.getByLabel('Name (optional)')).toHaveAttribute('maxlength', '80'); await expect(message).toHaveAttribute('maxlength', '2000');
  await page.getByLabel('Name (optional)').fill('x'.repeat(81)); await expect(page.getByLabel('Name (optional)')).toHaveValue('x'.repeat(80));
  await page.getByLabel('Name (optional)').fill('');
  await message.fill('Hello'); await submit.click(); await expect(page.getByRole('status')).toHaveText('Your public message was posted.');
  await expect(page.getByRole('article', { name: 'Message from Anonymous' })).toContainText('Hello'); await expect(submit).toBeDisabled(); expect(server.posts()).toBe(1);
  // A page reload starts a new page session; cooldown is intentionally not authoritative.
  await page.reload(); await expect(page.getByText('Hello', { exact: true })).toBeVisible();
  await page.getByLabel('Name (optional)').fill('Named visitor'); await message.fill('<script>alert(1)</script>'); await submit.click();
  await expect(page.getByRole('status')).toHaveText('Your public message was posted.');
  await expect(page.locator('article').first()).toContainText('Named visitor'); await expect(page.locator('article script')).toHaveCount(0);
  await page.reload(); await expect(page.getByText('<script>alert(1)</script>', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'review/guestbook-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 }); expect(await page.locator('.guestbook-page').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'review/guestbook-mobile.png', fullPage: true });
});

test('owner hide, unhide and confirmed delete persist and hidden entries disappear on logout', async ({ page }) => {
  const server = await backend(page); await page.goto('/guestbook'); await login(page);
  const hidden = page.getByRole('article', { name: 'Message from Hidden visitor' }); await expect(hidden.getByText('Hidden', { exact: true })).toBeVisible();
  await hidden.getByRole('button', { name: 'Unhide', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Message is public.');
  await page.getByRole('button', { name: 'Sign out' }).click(); await expect(page.getByText('Hidden note', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Owner login' }).click(); await page.getByLabel('Email', { exact: true }).fill('owner@example.test'); await page.getByLabel('Password', { exact: true }).fill('password'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await hidden.getByRole('button', { name: 'Hide', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Message hidden.');
  await page.reload(); await expect(hidden.getByText('Hidden', { exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.dismiss()); await hidden.getByRole('button', { name: 'Delete', exact: true }).click(); expect(server.rows).toHaveLength(2);
  page.once('dialog', dialog => dialog.accept()); await hidden.getByRole('button', { name: 'Delete', exact: true }).click(); await expect(hidden).toHaveCount(0); expect(server.rows).toHaveLength(1);
  await page.getByRole('article').getByRole('button', { name: 'Hide', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Message hidden.');
  await page.getByRole('button', { name: 'Sign out' }).click(); await expect(page.getByText('No messages yet.')).toBeVisible(); await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
});

test('honeypot and request failures are handled without losing drafts or faking an empty database', async ({ page }) => {
  const server = await backend(page); server.failReads(true); await page.goto('/guestbook');
  await expect(page.getByRole('alert')).toContainText('migration may not be applied'); await expect(page.getByText('No messages yet.')).toHaveCount(0);
  server.failReads(false); await page.getByRole('button', { name: 'Reload messages' }).click(); await expect(page.getByText('Welcome!', { exact: true })).toBeVisible();
  const trap = page.getByTestId('guestbook-honeypot'); await expect(trap).toHaveAttribute('tabindex', '-1');
  await trap.evaluate(el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el,'bot'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.getByLabel('Message', { exact: true }).fill('My draft'); await page.getByRole('button', { name: 'Leave a message', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Submission rejected'); expect(server.posts()).toBe(0);
  await page.reload(); server.failWrites(true); await page.getByLabel('Message', { exact: true }).fill('My draft'); await page.getByRole('button', { name: 'Leave a message', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Write failed'); await expect(page.getByLabel('Message', { exact: true })).toHaveValue('My draft');
  server.failWrites(false); await page.getByRole('button', { name: 'Leave a message', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Your public message was posted.');
});

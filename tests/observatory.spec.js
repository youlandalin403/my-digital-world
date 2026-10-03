import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180';

// Browser tests stub the HTTP boundary; actual PostgreSQL RLS is tested separately.
async function backend(page) {
  const records = [];
  const tasks = [];
  let failWrite = false;
  let failRead = false;
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`;
  await page.route('https://observatory.test/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.includes('/auth/v1/token')) return reply({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user });
    if (url.pathname.includes('/auth/v1/user')) return reply(user);
    if (url.pathname.includes('/auth/v1/logout')) return route.fulfill({ status: 204 });
    const authenticated = request.headers().authorization === `Bearer ${token}`;
    const method = request.method();
    if (method === 'GET' && failRead) return reply({ code: 'PGRST205', message: 'Database not ready' }, 404);
    if (method !== 'GET' && (failWrite || !authenticated)) return reply({ message: 'Write rejected' }, 403);
    const data = request.postDataJSON();
    const match = row => [...url.searchParams.entries()].every(([key, value]) => !value.startsWith('eq.') || String(row[key]) === value.slice(3));
    const single = request.headers().accept?.includes('vnd.pgrst.object');
    if (url.pathname.includes('/rpc/reorder_daily_tasks')) {
      data.task_ids.forEach((id, position) => { tasks.find(task => task.id === id).position = position; });
      return reply(null);
    }
    if (url.pathname.endsWith('/daily_records')) {
      if (method === 'POST') {
        if (!records.some(row => row.owner_id === data.owner_id && row.date === data.date)) records.push({ ...data, id: randomUUID(), reflection: '', visibility: 'private' });
        return reply(null, 201);
      }
      const selected = records.filter(match).filter(row => authenticated || row.visibility === 'public');
      if (method === 'PATCH') selected.forEach(row => Object.assign(row, data));
      const output = selected.map(row => ({ ...row, daily_tasks: tasks.filter(task => task.record_id === row.id) }));
      return reply(single ? output[0] ?? null : output);
    }
    if (url.pathname.endsWith('/daily_tasks')) {
      if (method === 'POST') {
        const row = { ...data, id: randomUUID(), done: false };
        tasks.push(row); return reply(row, 201);
      }
      const selected = tasks.filter(match);
      if (method === 'PATCH') selected.forEach(row => Object.assign(row, data));
      if (method === 'DELETE') selected.forEach(row => tasks.splice(tasks.indexOf(row), 1));
      return reply(single ? selected[0] : selected);
    }
    return reply({ message: 'Unexpected request' }, 500);
  });
  return { failWrites: value => { failWrite = value; }, failReads: value => { failRead = value; } };
}

async function login(page) {
  await page.getByRole('button', { name: 'Owner login' }).click();
  await page.getByLabel('Email', { exact: true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Reflection', exact: true })).toBeVisible();
}

test('Daily workflow persists over reload, separates dates, and handles privacy and errors', async ({ page }) => {
  const server = await backend(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/observatory');
  await expect(page.getByText('No public record for this day.')).toBeVisible();
  await login(page);
  const today = await page.getByLabel('Daily date', { exact: true }).inputValue();
  for (const text of ['First task', 'Second task', 'Third task']) {
    await page.getByLabel('New task', { exact: true }).fill(text);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByLabel('New task', { exact: true })).toHaveValue('');
  }
  await page.getByLabel('Complete First task', { exact: true }).click();
  await expect(page.getByLabel('Complete First task', { exact: true })).toBeChecked();
  await page.getByRole('textbox', { name: 'Reflection', exact: true }).fill('Today remains.');
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Reflection', exact: true })).toHaveValue('Today remains.');
  await expect(page.getByLabel('Complete First task', { exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox')).toHaveCount(3);
  await page.getByRole('button', { name: 'Previous day', exact: true }).click();
  await page.getByRole('textbox', { name: 'Reflection', exact: true }).fill('Yesterday is separate.');
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.getByLabel('Daily date', { exact: true })).toHaveValue(today);
  await expect(page.getByRole('textbox', { name: 'Reflection', exact: true })).toHaveValue('Today remains.');
  await page.getByLabel('Task 2', { exact: true }).fill('Edited task');
  await page.getByRole('button', { name: 'Save task 2', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Move task 2 up', exact: true }).click();
  await expect(page.getByLabel('Task 1', { exact: true })).toHaveValue('Edited task');
  await page.getByRole('button', { name: 'Delete task 3', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  server.failWrites(true);
  await page.getByRole('textbox', { name: 'Reflection', exact: true }).fill('Draft survives a failed save.');
  await expect(page.getByRole('status')).toHaveText('Unsaved changes');
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save');
  await expect(page.getByRole('textbox', { name: 'Reflection', exact: true })).toHaveValue('Draft survives a failed save.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Previous day', exact: true }).click();
  await expect(page.getByLabel('Daily date', { exact: true })).toHaveValue(today);
  server.failWrites(false);
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.locator('.observatory-page').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'review/observatory-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('.observatory-page').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'review/observatory-mobile.png', fullPage: true });
  expect(await page.locator('.observatory-page').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByText('No public record for this day.')).toBeVisible();
  await expect(page.getByText('Draft survives a failed save.')).toHaveCount(0);
  await login(page);
  await page.getByLabel('Visibility', { exact: true }).selectOption('public');
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByText('Draft survives a failed save.')).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await expect(page.getByRole('checkbox').first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save reflection', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Draft survives a failed save.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('missing migration or read failure is an error, not an empty day', async ({ page }) => {
  const server = await backend(page);
  server.failReads(true);
  await page.goto('/observatory');
  await expect(page.getByRole('alert')).toContainText('Could not load this day');
  await expect(page.getByText('No public record for this day.')).toHaveCount(0);
  server.failReads(false);
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.getByText('No public record for this day.')).toBeVisible();
});

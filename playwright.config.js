import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4188',
    channel: 'msedge',
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --port 4188 --strictPort',
    url: 'http://127.0.0.1:4188',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: 'https://observatory.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test_only',
      VITE_OBSERVATORY_OWNER_ID: '4dde6af0-2fd6-4520-86a7-8241acb9c180',
      VITE_GUESTBOOK_CONTACT_EMAIL: 'contact@example.test',
    },
  },
});

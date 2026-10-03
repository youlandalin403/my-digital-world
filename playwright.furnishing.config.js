import config from './playwright.config.js';
export default { ...config, use: { ...config.use, baseURL: 'http://127.0.0.1:4193' }, webServer: { ...config.webServer, command: 'npm run dev -- --port 4193 --strictPort', url: 'http://127.0.0.1:4193' } };


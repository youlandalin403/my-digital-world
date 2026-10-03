import config from './playwright.config.js';
// Run against a separately managed dev server to avoid Windows webServer teardown hangs.
export default { ...config, workers: 1, use: { ...config.use, baseURL: 'http://127.0.0.1:4196' }, webServer: undefined };

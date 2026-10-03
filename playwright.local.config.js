import config from './playwright.config.js';
// Local-only server on 4189 must be started with the same mock environment as
// playwright.config.js. Avoid Windows managed-webServer teardown hangs.
export default { ...config, workers: 1, use: { ...config.use, baseURL: 'http://127.0.0.1:4189' }, webServer: undefined };

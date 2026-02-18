module.exports = {
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 800, height: 600 },
    ignoreHTTPSErrors: true,
  },
  timeout: 30000,
};

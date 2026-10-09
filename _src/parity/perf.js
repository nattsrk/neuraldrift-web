// Page-load comparison: original one-file site (A) vs multi-page build (B), mobile 4G profile.
// Measures bytes downloaded before the page is usable, Largest Contentful Paint and load time.
const { chromium } = require('playwright-core');
const fs = require('fs');
const A = 'http://localhost:8830/Neural_Drift_Website.html', B = 'http://localhost:8831';
const PAGES = [['/', '/'], ['/ge6/voyage-optimization', '/ge6/voyage-optimization/'], ['/company/insights/eu-ets-2026', '/company/insights/eu-ets-2026/'], ['/company/contact', '/company/contact/']];
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const rows = [];
  for (const [ra, rb] of PAGES) {
    for (const [label, url] of [['A', A + '#' + ra], ['B', B + rb]]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 }); // "fast 4G": 9 Mbps, 150 ms
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      let bytes = 0; cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
      await p.addInitScript(() => { window.__lcp = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
      const t0 = Date.now();
      await p.goto(url, { waitUntil: 'load', timeout: 300000 });
      const loadMs = Date.now() - t0;
      await p.waitForTimeout(1500);
      const lcp = await p.evaluate(() => Math.round(window.__lcp));
      rows.push({ page: ra, version: label, loadMs, lcpMs: lcp, kb: Math.round(bytes / 1024) });
      await ctx.close();
    }
  }
  fs.writeFileSync(process.argv[2] || 'perf.json', JSON.stringify(rows, null, 1));
  console.table(rows);
  await browser.close();
})();

// Parity test: Vicky's one-file site (A) vs the multi-page conversion (B).
// node parity.js <outdir> [widths]   — needs playwright-core (scratchpad) and Google Chrome.
// For every route and width: text of the page + header + footer, a full-page screenshot, JS errors,
// broken internal links and missing files. Motion is reduced in both so films show their posters
// and reveal effects are settled; a separate behaviour pass checks films, menus and the GE6 frame.
const { chromium } = require(process.env.PW || 'playwright-core');
const fs = require('fs'), path = require('path');
const A = 'http://localhost:8830/Neural_Drift_Website.html';
const B = 'http://localhost:8831';
const OUT = process.argv[2] || 'parity-out';
const WIDTHS = (process.argv[3] || '1440,390').split(',').map(Number);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const ROUTES_ALL = ['/', '/ge6/voyage-optimization', '/ge6/live-watchkeeper', '/ge6/voyage-analysis', '/serve/merchant-ships', '/serve/onshore',
  '/serve/who-uses-ge6', '/company/about', '/company/leadership', '/company/testimonials', '/company/contact', '/company/insights',
  '/company/insights/imo-net-zero-framework', '/company/insights/cii-2027-2030', '/company/insights/eu-ets-2026',
  '/company/insights/fueleu-compliance-year', '/company/insights/imo-dcs-2026', '/company/insights/biofouling-border-check',
  '/company/insights/vlsfo-co2-factor', '/company/insights/emission-control-areas-2025-2028', '/company/insights/solas-voyage-planning',
  '/privacy', '/404'];
const ROUTES = ONLY || ROUTES_ALL;
const bPath = r => r === '/' ? '/' : r === '/404' ? '/404.html' : r + '/';
fs.mkdirSync(OUT, { recursive: true });

const grab = () => {
  const vis = el => el && !el.closest('[hidden]');
  const pg = [...document.querySelectorAll('main .page')].find(p => !p.hidden);
  const norm = t => (t || '').replace(/\s+/g, ' ').trim();
  const freeze = t => t.replace(/\b\d{2}:\d{2}\b/g, 'HH:MM');
  return {
    title: document.title,
    page: freeze(norm(pg && pg.innerText)),
    header: freeze(norm(document.querySelector('#hd') && document.querySelector('#hd').innerText)),
    footer: freeze(norm(document.querySelector('.ft') && document.querySelector('.ft').innerText)),
    imgs: pg ? [...pg.querySelectorAll('img')].filter(vis).map(i => i.getAttribute('data-k') || (i.currentSrc || '').split('/').pop()).sort() : [],
    films: pg ? [...pg.querySelectorAll('.m-film')].map(f => f.getAttribute('data-film')).sort() : [],
    links: pg ? [...pg.querySelectorAll('a[href]')].map(a => a.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).length : 0,
    h: document.documentElement.scrollHeight,
  };
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const results = [];
  for (const w of WIDTHS) {
    const ctxA = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    const ctxB = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    const pa = await ctxA.newPage(), pb = await ctxB.newPage();
    const errA = [], errB = [], badB = [];
    pa.on('pageerror', e => errA.push(String(e))); pb.on('pageerror', e => errB.push(String(e)));
    pb.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) badB.push(r.status() + ' ' + r.url()); });
    await pa.goto(A + '#/', { waitUntil: 'load', timeout: 120000 });
    for (const r of ROUTES) {
      const tag = (r === '/' ? 'home' : r.slice(1).replace(/\//g, '_')) + '-' + w;
      errA.length = 0; errB.length = 0; badB.length = 0;
      await pa.evaluate(rt => { location.hash = '#' + rt; }, r);
      await pa.waitForTimeout(700);
      await pb.goto(B + bPath(r), { waitUntil: 'networkidle', timeout: 60000 });
      await pb.waitForTimeout(700);
      for (const p of [pa, pb]) await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(z => setTimeout(z, 40)); } scrollTo(0, 0); });
      const settle = async p => { await p.evaluate(async () => { const imgs = [...document.querySelectorAll('img')].filter(i => i.getAttribute('src')); imgs.forEach(i => { i.loading = 'eager'; }); await Promise.all(imgs.map(i => i.complete ? (i.decode ? i.decode().catch(() => {}) : 0) : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); }))); }); await p.waitForTimeout(400); };
      await settle(pa); await settle(pb);
      const ga = await pa.evaluate(grab), gb = await pb.evaluate(grab);
      await pa.screenshot({ path: path.join(OUT, tag + '-A.png'), fullPage: true });
      await pb.screenshot({ path: path.join(OUT, tag + '-B.png'), fullPage: true });
      results.push({ route: r, width: w, A: ga, B: gb, errA: [...errA], errB: [...errB], badB: [...badB] });
      process.stdout.write('.');
    }
    await ctxA.close(); await ctxB.close();
  }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  await browser.close();
  console.log('\ndone', results.length);
})();

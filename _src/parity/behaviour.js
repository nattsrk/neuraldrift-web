// Behaviour test on the converted site (B), with normal motion, compared with the original (A) where it applies.
// node behaviour.js <outfile.json>
const { chromium } = require('playwright-core');
const fs = require('fs');
const A = 'http://localhost:8830/Neural_Drift_Website.html', B = 'http://localhost:8831';
const out = process.argv[2] || 'behaviour.json';
const R = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });

  // 1 · films play on scroll (A vs B), home + one module page
  for (const [label, url] of [['A-home', A + '#/'], ['B-home', B + '/'], ['A-vo', A + '#/ge6/voyage-optimization'], ['B-vo', B + '/ge6/voyage-optimization/']]) {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url, { waitUntil: 'load', timeout: 120000 }); await sleep(1500);
    const seen = {};
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 450) {
      await p.evaluate(v => scrollTo(0, v), y); await sleep(700);
      const st = await p.evaluate(() => [...document.querySelectorAll('.page:not([hidden]) .m-film')].map(f => [f.getAttribute('data-film'), f.getAttribute('data-state') || '', f.getAttribute('data-rendition') || '', (f.querySelector('video') || {}).currentTime || 0]));
      st.forEach(([id, s, rend, t]) => { if (!seen[id] || s === 'playing') seen[id] = { state: s, rendition: rend, t: +t.toFixed(2) }; });
    }
    R['films-' + label] = { films: seen, errors: errs };
  }

  // 2 · home scroll story lines change with scroll (B)
  {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await p.goto(B + '/', { waitUntil: 'load' }); await sleep(800);
    const states = [];
    for (const f of [0.05, 0.45, 0.85]) {
      await p.evaluate(fr => { const h = document.getElementById('home-hero'); const span = h.getBoundingClientRect().height - innerHeight; scrollTo(0, h.offsetTop + span * fr); }, f);
      await sleep(500);
      states.push(await p.evaluate(() => [...document.querySelectorAll('#home-hero .hh-line')].findIndex(l => l.classList.contains('is-on'))));
    }
    R.homeStory = states;
  }

  // 3 · desktop mega menus + current marks (B)
  {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await p.goto(B + '/ge6/live-watchkeeper/', { waitUntil: 'load' }); await sleep(600);
    const trigs = await p.$$eval('.hd-trig', bs => bs.map(b => b.getAttribute('data-menu')));
    const menus = {};
    for (const k of trigs) {
      await p.hover(`.hd-trig[data-menu="${k}"]`); await sleep(500);
      menus[k] = await p.evaluate(key => { const m = document.getElementById('mm-' + key); return !!m && !m.hidden && m.classList.contains('is-open'); }, k);
      await p.mouse.move(700, 800); await sleep(700);
    }
    R.megaMenus = menus;
    R.currentMark = await p.evaluate(() => ({ trigger: (document.querySelector('.hd-trig.is-current') || {}).getAttribute ? document.querySelector('.hd-trig.is-current').getAttribute('data-menu') : null, items: [...document.querySelectorAll('[aria-current="page"]')].map(a => a.getAttribute('href')) }));
  }

  // 4 · phone sheet (B)
  {
    const p = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
    await p.goto(B + '/company/about/', { waitUntil: 'load' }); await sleep(600);
    await p.tap('.hd-menu'); await sleep(600);
    R.phoneSheet = await p.evaluate(() => { const s = document.getElementById('sheet'); return { open: !s.hidden && s.classList.contains('is-open'), links: s.querySelectorAll('a').length }; });
  }

  // 5 · GE6 engine page opens in its frame and its links come back to the site (B)
  {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(B + '/ge6/', { waitUntil: 'load' }); await sleep(2500);
    const fr = await p.$('.ge6-host iframe');
    const frame = fr && await fr.contentFrame();
    const ready = frame ? await frame.evaluate(() => document.title) : null;
    let back = null;
    if (frame) {
      const link = await frame.$('a[href^="index.html#/ge6/"]');
      if (link) { await link.click(); await sleep(2500); back = p.url().replace(B, ''); }
    }
    R.ge6Frame = { framed: !!fr, title: ready, linkBackTo: back, errors: errs };
  }

  // 6 · old #/ links redirect to the new address (B)
  {
    const p = await (await browser.newContext()).newPage();
    await p.goto(B + '/#/company/insights/eu-ets-2026', { waitUntil: 'load' }); await sleep(1200);
    R.oldHashRedirect = p.url().replace(B, '');
  }

  // 7 · every internal link and file on every page resolves (B)
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const seen = new Set(), bad = [], errsByPage = {};
    const pages = ['/', '/ge6/', '/404.html'];
    const sm = await (await ctx.request.get(B + '/sitemap.xml')).text();
    (sm.match(/<loc>[^<]+<\/loc>/g) || []).forEach(l => pages.push(l.replace(/<\/?loc>/g, '').replace('https://neuraldrifts.com', '')));
    for (const u of [...new Set(pages)]) {
      const errs = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => errs.push(String(e)));
      await p.goto(B + u, { waitUntil: 'load' }); await sleep(300);
      if (errs.length) errsByPage[u] = errs;
      const hrefs = await p.$$eval('a[href]', as => as.map(a => a.getAttribute('href')).filter(h => h.startsWith('/')));
      const srcs = await p.$$eval('link[href^="/"],script[src^="/"]', es => es.map(e => e.getAttribute('href') || e.getAttribute('src')));
      for (const h of [...hrefs, ...srcs]) {
        const k = h.split('#')[0]; if (!k || seen.has(k)) continue; seen.add(k);
        const r = await ctx.request.get(B + k); if (r.status() >= 400) bad.push(r.status() + ' ' + k + ' (on ' + u + ')');
      }
    }
    const media = JSON.parse((await (await ctx.request.get(B + '/assets/js/media.js')).text()).replace(/^[\s\S]*?=\s*/, '').replace(/;\s*$/, ''));
    for (const v of Object.values(media)) { const r = await ctx.request.head(B + v); if (r.status() >= 400) bad.push(r.status() + ' ' + v + ' (media map)'); }
    R.links = { pagesChecked: pages.length, uniqueChecked: seen.size, mediaChecked: Object.keys(media).length, broken: bad, jsErrors: errsByPage };
  }

  fs.writeFileSync(out, JSON.stringify(R, null, 1));
  await browser.close();
  console.log(JSON.stringify(R, null, 1));
})();

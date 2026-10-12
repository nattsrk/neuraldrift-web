"""Convert Vicky's one-file Neural Drift website into a cloud-ready multi-page static site.

    python3 _src/convert.py <path to Neural_Drift_Website.html>

Nothing is redesigned: markup, CSS and scripts are carried over as they are. Only these change:
  * each <section class="page" data-route=…> becomes its own page at a clean URL
  * fonts, favicons, films, posters, photos and the GE6 engine page become separate files
  * five small, listed patches to the site script (see PATCHES) so it reads pages from the
    address bar and media from files instead of the hidden one-file store
Output: the folder above _src/ (index.html, ge6/…/index.html, assets/, media/, sitemap.xml …)
"""
import base64, hashlib, html, json, pathlib, re, shutil, sys

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://neuraldrifts.com'
EXT = {'video/webm': 'webm', 'video/mp4': 'mp4', 'image/avif': 'avif', 'image/png': 'png', 'image/svg+xml': 'svg',
       'image/jpeg': 'jpg', 'image/webp': 'webp', 'font/woff2': 'woff2', 'font/woff': 'woff', 'application/font-woff2': 'woff2'}
report = {'files': [], 'patches': [], 'pages': []}

s = SRC.read_text(encoding='utf-8')
for d in ('assets', 'media', 'ge6', 'serve', 'company', 'privacy'):
    shutil.rmtree(OUT / d, ignore_errors=True)
for f in OUT.glob('*.html'):
    f.unlink()
(OUT / 'assets/css').mkdir(parents=True); (OUT / 'assets/js').mkdir(); (OUT / 'assets/fonts').mkdir(); (OUT / 'assets/img').mkdir()
(OUT / 'media').mkdir()


def write_data_uri(uri, rel):
    m = re.match(r'data:([^;,]+)(;base64)?,(.*)', uri, re.S)
    mime, b64, payload = m.group(1), m.group(2), m.group(3)
    data = base64.b64decode(re.sub(r'\s+', '', payload)) if b64 else html.unescape(payload).encode()
    p = OUT / (rel + '.' + EXT.get(mime, 'bin'))
    p.write_bytes(data)
    report['files'].append((str(p.relative_to(OUT)), len(data), hashlib.sha256(data).hexdigest()[:12]))
    return '/' + str(p.relative_to(OUT))


# ── head ─────────────────────────────────────────────────────────────────────
b = s.index('<body')
head, body = s[:b], s[b:]
css = re.search(r'<style>(.*?)</style>', head, re.S).group(1)
def font(m):
    blk = m.group(0)
    fam = re.search(r"font-family:\s*['\"]?([^;'\"]+)", blk).group(1).strip().lower().replace(' ', '-')
    w = re.search(r'font-weight:\s*(\d+)', blk).group(1)
    return re.sub(r'url\(["\']?(data:[^)"\']+)["\']?\)', lambda u: f"url('{write_data_uri(u.group(1), f'assets/fonts/{fam}-{w}')}')", blk)
css = re.sub(r'@font-face\s*{[^}]*}', font, css)
assert 'data:font' not in css and 'data:application/font' not in css
# cross-page fade, the multi-page equivalent of the one-file page swap
css += '\n/* multi-page build: soft cross-fade between pages, as the one-file build did on route change */\n@view-transition { navigation: auto; }\n@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }\n'
(OUT / 'assets/css/site.css').write_text(css)

icons = {}
for rel, tag in (('icon-svg', r'<link rel="icon" type="image/svg\+xml" href="([^"]+)">'), ('icon-32', r'<link rel="icon" type="image/png" sizes="32x32" href="([^"]+)">'), ('apple-touch-icon', r'<link rel="apple-touch-icon" href="([^"]+)">')):
    icons[rel] = write_data_uri(re.search(tag, head).group(1), 'assets/img/' + rel)
ldjson = re.search(r'<script type="application/ld\+json">(.*?)</script>', head, re.S).group(1)
head_scripts = re.findall(r'<script>(.*?)</script>', head, re.S)
early_js, config_js = head_scripts[0], head_scripts[1]
(OUT / 'assets/js/config.js').write_text(config_js.strip() + '\n')

# ── body: shell, pages, store, scripts ───────────────────────────────────────
mo = body.index('<main'); mo_end = body.index('>', mo) + 1
mc = body.index('</main>')
store_at = body.index('<div id="nd-store" hidden>')
pre_main, main_open = body[:mo], body[mo:mo_end]
main_inner = body[mo_end:mc]
post_main = body[mc + len('</main>'):store_at]
store = body[store_at:]
store_end = store.index('</div>', store.rindex('</script>', 0, store.index('<script>'))) + 6
tail = store[store_end:]
store = store[:store_end]

media = {}
for m in re.finditer(r'<script type="text/plain" id="nd-m-([^"]+)">(.*?)</script>', store, re.S):
    key = m.group(1)
    sub = 'media/films/' if re.match(r'(av1|h264)-', key) else 'media/'
    media[key] = write_data_uri(m.group(2).strip(), sub + key) if sub == 'media/' else None
    if sub != 'media/':
        (OUT / 'media/films').mkdir(exist_ok=True)
        media[key] = write_data_uri(m.group(2).strip(), sub + key)
(OUT / 'assets/js/media.js').write_text('/* Media map: the files that the one-file build kept in its hidden store. */\nwindow.ND_MEDIA = ' + json.dumps(media, indent=1) + ';\n')

# GE6 engine page: its own file, with the same bridge the one-file build injected
g = re.search(r'<script type="text/plain" id="nd-ge6">(.*?)</script>', store, re.S).group(1)
ge6_html = base64.b64decode(re.sub(r'\s+', '', g)).decode('utf-8')
main_js_all = re.findall(r'<script>(.*?)</script>', tail, re.S)
aurora_js, fx_js, main_js = main_js_all
bridge = re.search(r"var BRIDGE = (.*?);\n", main_js, re.S).group(1)
bridge_src = eval(bridge.replace("'<' + 'script>", "'<script>").replace("'<' + '/script>'", "'</script>'").replace("\n", " ").replace("+", "+"))  # plain string concat
ge6_html = ge6_html.replace('<head>', '<head>' + bridge_src + '<meta name="robots" content="noindex">', 1)
(OUT / 'ge6').mkdir(exist_ok=True)
(OUT / 'ge6/engine.html').write_text(ge6_html)
report['files'].append(('ge6/engine.html', len(ge6_html.encode()), ''))

(OUT / 'assets/js/aurora-head.js').write_text(aurora_js.strip() + '\n')
(OUT / 'assets/js/fx.js').write_text(fx_js.strip() + '\n')

# ── the five patches to the site script ──────────────────────────────────────
PATCHES = [
    ('media read from files, not the hidden store',
     "function stored(key) { var el = D.getElementById('nd-m-' + key); return el ? el.textContent : ''; }",
     "function stored(key) { return (W.ND_MEDIA && W.ND_MEDIA[key]) || ''; }"),
    ('films keep the one-file rendition set (720p AV1 + H.264), now as files',
     "var single = !!D.getElementById('nd-store');",
     "var single = true; // multi-page build: same 720p AV1 / H.264 films, read from media/films/"),
    ('GE6 engine page opened from its own file',
     "    var box = D.getElementById('nd-ge6');\n    if (!box || !W.Blob || !W.URL || !URL.createObjectURL || !W.TextDecoder) return null;",
     "    var box = D.getElementById('nd-ge6'); // gone in the multi-page build; the page is /ge6/engine.html"),
    ('GE6 engine page opened from its own file',
     "        if (!url) url = URL.createObjectURL(new Blob([page(BRIDGE)], { type: 'text/html;charset=utf-8' }));",
     "        if (!url) url = '/ge6/engine.html';"),
    ('GE6 engine page opened from its own file',
     "      var fallback = function () {\n        if (f !== frame || f.__ready || viaDoc) return;",
     "      var fallback = function () {\n        if (!box) return;\n        if (f !== frame || f.__ready || viaDoc) return;"),
    ('links from the GE6 engine page go to real addresses',
     "      if (d.to.indexOf('#/') === 0) W.location.hash = d.to;",
     "      if (d.to.indexOf('#/') === 0) W.location.href = toPath(d.to);"),
    ('pages come from the address bar, not #/ routes',
     "  // ── routing: one file, one page at a time ─────────────────────────────────\n  function routeFromHash() {\n    var h = W.location.hash || '#/';\n    if (h.indexOf('#/') !== 0) return null;\n    var r = decodeURIComponent(h.slice(1).split('?')[0]);\n    if (r.length > 1 && r.charAt(r.length - 1) === '/') r = r.slice(0, -1);\n    return r;\n  }",
     "  // ── routing (multi-page build): one page per address; old #/ links are sent to the new address ──\n  function norm(p) { p = decodeURIComponent(String(p || '/').split('#')[0].split('?')[0]).replace(/index\\.html$/, ''); if (p === '/404.html') p = '/404'; if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1); return p || '/'; }\n  function toPath(h) { var r = norm(h.replace(/^#/, '')); return r === '/' ? '/' : r + '/'; }\n  if ((W.location.hash || '').indexOf('#/') === 0) { W.location.replace(toPath(W.location.hash)); return; }\n  function routeFromHash() { return norm(W.location.pathname); }"),
    ('in-page # links still scroll; #/ links go to the page',
     "  function onHash() {\n    var r = routeFromHash();\n    if (r === null) {",
     "  function onHash() {\n    if ((W.location.hash || '').indexOf('#/') === 0) { W.location.replace(toPath(W.location.hash)); return; }\n    var r = null;\n    if (r === null) {"),
    ('menu groups and current-page marks compare addresses',
     "        var r = a.getAttribute('href').slice(1);",
     "        var r = norm(a.getAttribute('href'));"),
    ('menu groups and current-page marks compare addresses',
     "$$('.mm-item, .sg-list a, .ft-col a').forEach(function (a) { if (a.getAttribute('href') === '#' + route) a.setAttribute('aria-current', 'page'); });",
     "$$('.mm-item, .sg-list a, .ft-col a').forEach(function (a) { var h = a.getAttribute('href') || ''; if (h.charAt(0) === '/' && norm(h) === route) a.setAttribute('aria-current', 'page'); });"),
    ('start: show the page this address belongs to',
     "  var r0 = routeFromHash();\n  show(r0 === null ? '/' : r0, true);\n  if (r0 === null && W.location.hash.length > 1) onHash();",
     "  var r0 = routeFromHash();\n  show(r0, true);\n  if (W.location.hash.length > 1) onHash();"),
]
for why, a, b2 in PATCHES:
    if a not in main_js:
        raise SystemExit('PATCH NOT FOUND: ' + why + '\n' + a[:120])
    main_js = main_js.replace(a, b2, 1)
    report['patches'].append(why)
(OUT / 'assets/js/site.js').write_text(main_js.strip() + '\n')

# ── links: #/route → /route/ ─────────────────────────────────────────────────
def links(x):
    x = re.sub(r'(href|data-copy|data-share|content)="(https://neuraldrifts\.com/)#/([^"]*)"', lambda m: f'{m.group(1)}="{m.group(2)}{m.group(3).rstrip("/")}{"/" if m.group(3) else ""}"', x)
    x = re.sub(r'href="#/([^"]*)"', lambda m: 'href="/' + (m.group(1).rstrip('/') + '/' if m.group(1) else '') + '"', x)
    return x
pre_main, post_main = links(pre_main), links(post_main)

# ── pages ────────────────────────────────────────────────────────────────────
sections = list(re.finditer(r'<section class="page[^"]*"[^>]*data-route="([^"]+)"[^>]*>', main_inner))
HEAD = '''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0A1628">
<meta name="robots" content="{robots}">
<meta name="format-detection" content="telephone=no">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="Neural Drift">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/media/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="{icon_svg}">
<link rel="icon" type="image/png" sizes="32x32" href="{icon_32}">
<link rel="apple-touch-icon" href="{apple}">
<link rel="preload" href="/assets/css/site.css" as="style">
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">{ld}</script>
<script>{early}</script>
<script src="/assets/js/config.js"></script>
</head>
'''
urls = []
for i, m in enumerate(sections):
    route = m.group(1)
    start = m.start(); end = sections[i + 1].start() if i + 1 < len(sections) else len(main_inner)
    sec = main_inner[start:end].rstrip()
    sec = sec.replace(' hidden>', '>', 1) if m.group(0).endswith(' hidden>') else sec
    sec = links(sec)
    tag = m.group(0)
    title = html.unescape(re.search(r'data-title="([^"]*)"', tag).group(1))
    desc = html.unescape(re.search(r'data-desc="([^"]*)"', tag).group(1))
    path = '/' if route == '/' else ('/404.html' if route == '/404' else route + '/')
    url = SITE + ('/' if route == '/404' else path)
    is_art = 'page--article' in tag
    doc = HEAD.format(title=html.escape(title), desc=html.escape(desc), url=url, site=SITE,
                      robots='noindex' if route == '/404' else 'index, follow', ogtype='article' if is_art else 'website',
                      icon_svg=icons['icon-svg'], icon_32=icons['icon-32'], apple=icons['apple-touch-icon'], ld=ldjson, early=early_js)
    doc += pre_main + main_open + '\n' + sec + '\n</main>' + post_main
    doc += '<script src="/assets/js/aurora-head.js"></script>\n<script src="/assets/js/fx.js"></script>\n<script src="/assets/js/media.js"></script>\n<script src="/assets/js/site.js"></script>\n</body>\n</html>\n'
    dest = OUT / ('404.html' if route == '/404' else (path.strip('/') + '/index.html' if route != '/' else 'index.html'))
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(doc)
    report['pages'].append((route, str(dest.relative_to(OUT)), len(doc.encode())))
    if route != '/404':
        urls.append(url)

(OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
(OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
(OUT / '_src/convert-report.json').write_text(json.dumps(report, indent=1))
print(f"pages {len(report['pages'])}, files {len(report['files'])}, patches {len(report['patches'])}")

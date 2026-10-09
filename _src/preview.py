"""Build a private test copy under a sub-path (GitHub Pages project site), with a passcode screen.

    python3 _src/preview.py <base> <passcode> [original.html]     e.g. /nd-preview-v3-xxxx Drift-4827

Writes _preview/ (keeps its .git): every root-absolute link prefixed with <base>, the site script told
about the base, noindex everywhere, robots blocking all, no CNAME/sitemap. If an original one-file
build is given it is copied to <base>/original/ for side-by-side review.
"""
import hashlib, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / '_preview'
base, code = sys.argv[1].rstrip('/'), sys.argv[2]
orig = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else None
digest = hashlib.sha256(code.encode()).hexdigest()

GATE = """<style>html.nd-locked body>*:not(#nd-gate){visibility:hidden}#nd-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#0A1628;font:16px/1.5 system-ui,sans-serif;color:#F5F8FA}
#nd-gate form{width:min(360px,88vw);text-align:center}#nd-gate h1{font-size:22px;margin:0 0 6px;color:#fff}#nd-gate p{margin:0 0 18px;color:#9BACBD;font-size:14px}
#nd-gate input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid #33465C;background:#12233A;color:#fff;font-size:16px}
#nd-gate button{margin-top:12px;width:100%;padding:12px;border:0;border-radius:99px;background:#42C2D9;color:#0A1628;font-weight:700;font-size:16px;cursor:pointer}#nd-gate .bad{color:#FDA29B;margin-top:10px;min-height:20px}</style>
<script>(function(){var H='__HASH__',K='nd-preview-ok';function ok(){try{return localStorage.getItem(K)===H}catch(e){return false}}
if(ok())return;document.documentElement.classList.add('nd-locked');
document.addEventListener('DOMContentLoaded',function(){var g=document.createElement('div');g.id='nd-gate';
g.innerHTML='<form><h1>Neural Drift · test preview</h1><p>Enter the passcode you were given.</p><input type="password" autocomplete="off" aria-label="Passcode" autofocus><button>Enter</button><div class="bad" role="alert"></div></form>';
document.body.appendChild(g);var f=g.querySelector('form');f.addEventListener('submit',function(e){e.preventDefault();
var v=f.querySelector('input').value.trim();crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(b){
var h=Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
if(h===H){try{localStorage.setItem(K,H)}catch(e){}document.documentElement.classList.remove('nd-locked');g.remove();}
else{f.querySelector('.bad').textContent='That passcode is not right.';}});});});})();</script>
""".replace('__HASH__', digest)

if OUT.exists():
    for c in OUT.iterdir():
        if c.name != '.git':
            shutil.rmtree(c) if c.is_dir() else c.unlink()
else:
    OUT.mkdir()
skip = {'_src', '_preview', '.git', 'CNAME', 'sitemap.xml', '.DS_Store', '__pycache__', 'node_modules'}
shutil.copytree(ROOT, OUT, dirs_exist_ok=True, ignore=lambda d, names: [n for n in names if n in skip])

for f in OUT.rglob('*.html'):
    s = f.read_text()
    s = re.sub(r'(href|src|content|data-copy|data-share)="/(?!/)', lambda m: f'{m.group(1)}="{base}/', s)
    s = re.sub(r'<meta name="robots" content="[^"]*">', '<meta name="robots" content="noindex, nofollow">', s)
    s = s.replace("url('/assets/", f"url('{base}/assets/")
    s = s.replace('<head>', '<head>' + GATE, 1) if '<head>' in s else s
    f.write_text(s)
css = OUT / 'assets/css/site.css'
css.write_text(css.read_text().replace("url('/assets/", f"url('{base}/assets/"))
media = OUT / 'assets/js/media.js'
media.write_text(media.read_text().replace('"/media/', f'"{base}/media/'))
js = OUT / 'assets/js/site.js'
j = js.read_text()
for a, b in [
    ("function norm(p) { p = decodeURIComponent(String(p || '/').split('#')[0].split('?')[0])",
     f"var BASE = '{base}';\n  function norm(p) {{ p = decodeURIComponent(String(p || '/').split('#')[0].split('?')[0]); if (p.indexOf(BASE) === 0) p = p.slice(BASE.length) || '/'; p = p"),
    ("function toPath(h) { var r = norm(h.replace(/^#/, '')); return r === '/' ? '/' : r + '/'; }",
     "function toPath(h) { var r = norm(h.replace(/^#/, '')); return BASE + (r === '/' ? '/' : r + '/'); }"),
    ("if (!url) url = '/ge6/engine.html';", f"if (!url) url = '{base}/ge6/engine.html';"),
    ("if (h.charAt(0) === '/' && norm(h) === route)", "if (h.charAt(0) === '/' && norm(h) === route)"),
]:
    if a not in j:
        raise SystemExit('preview patch not found: ' + a[:70])
    j = j.replace(a, b, 1)
js.write_text(j)
(OUT / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
(OUT / '.nojekyll').write_text('')
if orig:
    (OUT / 'original').mkdir(exist_ok=True)
    o = orig.read_text(encoding='utf-8').replace('<head>', '<head>' + GATE, 1)
    o = re.sub(r'<meta name="robots" content="[^"]*">', '<meta name="robots" content="noindex, nofollow">', o)
    (OUT / 'original/index.html').write_text(o, encoding='utf-8')
print('preview built', base)

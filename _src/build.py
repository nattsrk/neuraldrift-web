"""Build the static site: python3 _src/build.py

Each _src/pages/<name>.html holds one <article class="page"> with data-title and
data-description. The build wraps it with the shared head, icon sprite, header and
footer and writes it to its URL (index.html inside a folder, so links stay clean).
"""
import html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / '_src'
SITE = 'https://neuraldrifts.com'

OUT = {
    'index': '/', 'ge6': '/ge6/',
    'ge6-voyage-optimization': '/ge6/voyage-optimization/',
    'ge6-fleet-compliance': '/ge6/fleet-compliance/',
    'ge6-predictive-analytics': '/ge6/predictive-analytics/',
    'who-we-serve': '/who-we-serve/', 'company': '/company/', 'contact': '/contact/',
    'legal-privacy': '/legal/privacy/', 'legal-cookies': '/legal/cookies/',
    'legal-policies': '/legal/policies/', '404': '/404.html',
}
NOINDEX = {'404'}
REDIRECTS = {  # old neuraldrifts.com pages
    '/services.html': '/ge6/', '/about.html': '/company/', '/contact.html': '/contact/',
}

ORG = {
    '@context': 'https://schema.org', '@type': 'Organization', 'name': 'Neural Drift',
    'legalName': 'Neuraldrift Private Limited', 'url': SITE + '/', 'email': 'fleet@neuraldrifts.com',
    'telephone': '+91 99626 51950', 'foundingDate': '2026-10-01',
    'address': {'@type': 'PostalAddress', 'streetAddress': 'WeWork Olympia Cyberspace, No. 21/22, Alandur Road, 2nd Street, Guindy Industrial Estate',
                'addressLocality': 'Chennai', 'postalCode': '600032', 'addressRegion': 'Tamil Nadu', 'addressCountry': 'IN'},
    'sameAs': ['https://www.linkedin.com/company/143972936/'],
    'makesOffer': {'@type': 'Offer', 'itemOffered': {'@type': 'SoftwareApplication', 'name': 'GE6 Engine',
                   'applicationCategory': 'BusinessApplication'}},
}

HEAD = """<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0A1628">
<meta name="color-scheme" content="only light">
<meta name="robots" content="{robots}">
<meta name="format-detection" content="telephone=no">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Neural Drift">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/media/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/schibsted-grotesk-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/bricolage-grotesque-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">{org}</script>
<script>document.documentElement.classList.add('js');</script>
</head>
<body{body_cls}>
<a class="skip" href="#main">Skip to content</a>
"""

TAIL = """
<script src="/assets/js/site.js" defer></script>
</body>
</html>
"""


def build():
    sprite = (SRC / 'partials/sprite.svg').read_text()
    header = (SRC / 'partials/header.html').read_text()
    footer = (SRC / 'partials/footer.html').read_text()
    org = json.dumps(ORG, ensure_ascii=False, separators=(',', ':'))
    urls = []
    for name, path in OUT.items():
        page = (SRC / f'pages/{name}.html').read_text()
        art = re.match(r'<article[^>]*>', page).group(0)
        title = html.unescape(re.search(r'data-title="([^"]*)"', art).group(1))
        desc = html.unescape(re.search(r'data-description="([^"]*)"', art).group(1))
        url = SITE + path
        doc = HEAD.format(title=html.escape(title), desc=html.escape(desc), url=url, site=SITE, org=org,
                          robots='noindex, nofollow' if name in NOINDEX else 'index, follow', body_cls=' class="home"' if name == 'index' else '')
        doc += sprite + '\n' + header + '\n<main id="main">\n' + page.strip() + '\n</main>\n' + footer + TAIL
        dest = ROOT / (path.strip('/') or '.') / 'index.html' if path.endswith('/') else ROOT / path.lstrip('/')
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(doc)
        if name not in NOINDEX:
            urls.append(url)
    for old, new in REDIRECTS.items():
        (ROOT / old.lstrip('/')).write_text(
            f'<!doctype html><meta charset="utf-8"><title>Moved</title><meta name="robots" content="noindex">'
            f'<link rel="canonical" href="{SITE}{new}"><meta http-equiv="refresh" content="0; url={new}">'
            f'<a href="{new}">This page has moved.</a>\n')
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                      + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
    (ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
    print(f'built {len(OUT)} pages')


if __name__ == '__main__':
    build()

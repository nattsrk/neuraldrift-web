"""Compare parity captures: python3 compare.py <outdir>  → prints a table, writes compare.json and diff images."""
import json, pathlib, sys
from PIL import Image, ImageChops

D = pathlib.Path(sys.argv[1])
res = json.loads((D / 'results.json').read_text())
rows = []
for r in res:
    tag = (('home' if r['route'] == '/' else r['route'][1:].replace('/', '_')) + '-' + str(r['width']))
    a, b = Image.open(D / f'{tag}-A.png').convert('RGB'), Image.open(D / f'{tag}-B.png').convert('RGB')
    h = min(a.height, b.height)
    ac, bc = a.crop((0, 0, a.width, h)), b.crop((0, 0, b.width, h))
    diff = ImageChops.difference(ac, bc).convert('L').point(lambda v: 255 if v > 24 else 0)
    changed = sum(1 for v in diff.getdata() if v) / (diff.width * diff.height) * 100
    if changed > 0.5:
        out = Image.blend(bc, Image.new('RGB', bc.size, (255, 0, 0)), 0.0)
        red = Image.new('RGB', bc.size, (255, 0, 40))
        out.paste(red, mask=diff)
        out.resize((out.width // 2, out.height // 2)).save(D / f'{tag}-DIFF.png')
    A, B = r['A'], r['B']
    rows.append({
        'route': r['route'], 'w': r['width'],
        'title': A['title'] == B['title'],
        'text_page': A['page'] == B['page'], 'text_header': A['header'] == B['header'], 'text_footer': A['footer'] == B['footer'],
        'imgs': A['imgs'] == B['imgs'], 'films': A['films'] == B['films'], 'links': A['links'] == B['links'],
        'height': (A['h'], B['h']), 'pixels_changed_pct': round(changed, 3),
        'errA': len(r['errA']), 'errB': r['errB'][:3], 'missingB': r['badB'][:5],
    })
(D / 'compare.json').write_text(json.dumps(rows, indent=1))
ok = lambda x: 'ok' if x else 'DIFF'
print(f"{'route':48} {'w':>4} title page hdr ftr imgs film link  height(A/B)   px%   errB miss")
for x in rows:
    print(f"{x['route']:48} {x['w']:>4} {ok(x['title']):5} {ok(x['text_page']):4} {ok(x['text_header']):3} {ok(x['text_footer']):3} {ok(x['imgs']):4} {ok(x['films']):4} {ok(x['links']):4} {str(x['height']):>13} {x['pixels_changed_pct']:6} {len(x['errB']):4} {len(x['missingB'])}")

# neuraldrifts.com — website v02

Vicky's one-file design (9 Oct 2026), converted unchanged into a cloud-ready multi-page static site.

- Rebuild from a new one-file version: `python3 _src/convert.py <Neural_Drift_Website.html>`
- Preview locally: `python3 _src/serve.py 8831` → http://localhost:8831
- Parity tests (needs Chrome): `cd _src/parity && npm i && node parity.js <out> 1440,1024,768,390 && python3 compare.py <out>`; behaviour: `node behaviour.js`; load time: `node perf.js`
- Parity report: `_src/parity/report/PARITY-REPORT.html` (92/92 pages match; max 0.17 % pixel difference)
- Test copy with passcode: `python3 _src/preview.py <base> <passcode> [original.html]`

Working branch `v02-design`; `main` publishes neuraldrifts.com (live since 12 Oct 2026). Rollback point: tag `live-before-v02`.

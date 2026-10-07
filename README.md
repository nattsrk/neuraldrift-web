# neuraldrifts.com — website v01

Neural Drift (company) · GE6 Solutions (product). Static site, no framework.

- Edit content in `_src/pages.py`, header/footer in `_src/partials/`.
- Build: `python3 _src/pages.py && python3 _src/build.py` (writes clean-URL `index.html` files, sitemap, robots).
- Preview: `python3 _src/serve.py 8810` → http://localhost:8810 (supports video scrubbing).
- Photos: `media/<file>`; slot → file mapping in `assets/js/site.js` (`MEDIA`).

Branch `v01` is the redesign; `main` serves the live site via GitHub Pages.

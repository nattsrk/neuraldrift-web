# neuraldrift-web

Public marketing site for **Neural Drift** — <https://neuraldrifts.com>

Static HTML. No build step, no framework, no dependencies, no trackers.
Edit a file, commit, push — GitHub Pages redeploys within a minute.

## Layout

```
index.html        Home
services.html     Platform & Services
about.html        About
contact.html      Contact
404.html          Not found
assets/styles.css Shared stylesheet
assets/site.js    Mobile nav + contact-form mailto composer
CNAME             Custom domain binding — do not delete
sitemap.xml       Update lastmod when content changes materially
robots.txt        Points crawlers at the sitemap
.nojekyll         Serve files verbatim, skip Jekyll processing
```

## This repo is NOT the application

The Neural Drift platform lives in a separate **private** repository.
Nothing here touches customer data, credentials or the application source.
Keep it that way — this repo is public.

## Deploying

Push to `main`. GitHub Pages serves from the branch root.

DNS lives at GoDaddy:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<owner>.github.io` |

## Content rules

The site follows the product's own standard — **a dash, never a guess**:

1. Capabilities are labelled **Live**, **Rolling out** or **Roadmap**.
   Nothing is marked Live until it is.
2. No traction figures (vessel counts, customer counts) unless they are
   currently true and defensible.
3. Interface panels are marked `ILLUSTRATIVE` and must not be presented
   as results from a named vessel.

## Known follow-ups

- [ ] `fleet@neuraldrifts.com` must exist before launch — add the domain
      alias in Google Workspace, or contact mail bounces.
- [ ] Add a real `og:image` (1200×630) and reference it in each page head.
- [ ] Self-host the Google Fonts to avoid third-party IP logging (GDPR).
- [ ] Confirm the legal entity line in the footer with the company.

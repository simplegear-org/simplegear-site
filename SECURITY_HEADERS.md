# Security Headers

GitHub Pages repository files cannot reliably configure all response headers.
The site includes a strict meta Content Security Policy, but production edge
headers should be configured at GitHub Pages, Cloudflare, or another authorized
edge layer.

ACTION REQUIRED:

- Enable GitHub Pages "Enforce HTTPS".
- Confirm `http://simplegear.org/...` redirects to `https://simplegear.org/...`
  without losing query strings.
- Block force pushes and branch deletion on `main`.
- Require the `Validate site` GitHub Actions check before merging to `main`.
- Enable Private Vulnerability Reporting.

Recommended production headers:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
```

Do not claim these headers are active until verified on the live site.

Live checks on 2026-08-15 showed `http://simplegear.org/` and
`http://simplegear.org/invite/?payload=TEST` returning `200 OK` instead of an
HTTPS redirect, so HTTPS enforcement still needs production configuration.

Live check on 2026-08-15 showed
`https://simplegear.org/.well-known/apple-app-site-association` returning
`200 OK` with `content-type: application/octet-stream`. If Apple validation
requires `application/json`, configure that header at the edge.

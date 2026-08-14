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

Live check on 2026-08-14 showed `http://simplegear.org/invite?payload=TEST`
returning `200 OK` instead of an HTTPS redirect, so HTTPS enforcement still
needs production configuration.

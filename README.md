# SimpleGear Site

Official website and deep-link gateway for PeerLink X.

Production: https://simplegear.org

Functions:

- PeerLink X product landing page
- invite links
- account/device pairing links
- server configuration links
- Android App Links metadata
- iOS Universal Links metadata
- privacy policy
- initial server configuration QR

## Initial Server Configuration

The canonical source is `config/initial-server-config.json`.

Generated artifacts:

- `config/initial-server-config.generated.json`
- `initial-server-config-qr.svg`
- QR cache-bust links in `index.html` and `invite/index.html`

Homepage and invite-page configuration buttons build their deep links at
runtime from `config/initial-server-config.json`. Do not edit generated payloads
or QR links manually.

Run:

```sh
npm install
npm run validate
```

`npm run check`, `npm run validate`, and `npm run build` regenerate derived
configuration artifacts before checking the site.

After changing `config/initial-server-config.json`, run:

```sh
npm run validate
```

This updates `config/initial-server-config.generated.json`,
`initial-server-config-qr.svg`, QR cache-bust links in HTML, and validates that
the generated payload still matches the canonical JSON.

## Pull Request Validation

GitHub Actions runs on pull requests and pushes to `main`:

```sh
npm ci
npm run check
git diff --exit-code
```

If `config/initial-server-config.json` changes but generated artifacts are not
committed, the PR check fails.

For routine server-list updates, edit only
`config/initial-server-config.json`, run `npm run check`, review `git diff`,
and commit the canonical JSON plus the regenerated artifacts.

## Public Website Repository

This repository contains public source used to serve the official SimpleGear
website through GitHub Pages.

Recommended repository flow:

- open pull requests into `main`;
- merge only after the `Validate site` check passes;
- protect `main` from direct pushes, force pushes, and deletion.

## Related Repositories

PeerLink X client: https://github.com/simplegear-org/peerlink

PeerLink Servers: https://github.com/simplegear-org/peerlink_servers

## Licensing and Branding

The PeerLink X client and PeerLink Servers are distributed under the licenses
stated in their respective repositories.

Website content, logos, icons, and other brand materials in this repository are
not automatically licensed under those software licenses unless explicitly
stated otherwise.

No registered trademark status is claimed by this repository.

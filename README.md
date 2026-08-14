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
- homepage and invite-page configuration links at runtime

Run:

```sh
npm install
npm run generate
npm run validate
```

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

# Initial Server Configuration Classification

Generated payload source: `config/initial-server-config.json`.

TURN credentials in this public initial configuration are distributed to every
PeerLink X client that imports the default server configuration. They are
therefore classified as PUBLIC COMPATIBILITY CREDENTIALS for this website
repository, not operational secrets.

The non-standard TURN password for the `176.109.100.203` entries is retained for
client compatibility and must not be rotated or normalized from this repository
without coordinating the PeerLink X client and server deployment.

The `https://tangash.org` push endpoint is retained because it is present in the
current public configuration. Its infrastructure ownership should be confirmed
before any future replacement.

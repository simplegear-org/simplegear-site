import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const assetVersion = '20260814-1';
const maxPayloadLength = 65536;
const maxPairDataLength = 65536;

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    fail(`${relativePath}: JSON parse failed: ${error.message}`);
    return null;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function isWebSocketUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'wss:' && validHost(url.hostname);
  } catch (_) {
    return false;
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && validHost(url.hostname);
  } catch (_) {
    return false;
  }
}

function parseTurnUrl(value) {
  const match = /^(turns?):([^:/?]+|\[[^\]]+\])(?::\d{1,5})?(?:\?transport=(udp|tcp))?$/.exec(value);
  if (!match) return null;
  const host = match[2].replace(/^\[|\]$/g, '');
  const portMatch = /:(\d{1,5})(?:\?|$)/.exec(value);
  const port = portMatch ? Number(portMatch[1]) : null;
  return {
    host,
    port,
    valid: validHost(host) && (port === null || (Number.isInteger(port) && port >= 1 && port <= 65535)),
  };
}

function validHost(hostname) {
  return Boolean(hostname) && !hostname.includes('_') && !hostname.endsWith('.') && hostname !== 'localhost';
}

function canonical(value) {
  return JSON.stringify(value);
}

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function validateUrlList(name, values, predicate, { allowEmpty = false } = {}) {
  if (!Array.isArray(values)) {
    fail(`initial config: ${name} must be an array`);
    return;
  }
  if (!allowEmpty && values.length === 0) {
    fail(`initial config: ${name} must not be empty`);
  }
  if (values.some((url) => typeof url !== 'string' || !predicate(url))) {
    fail(`initial config: invalid ${name} URLs`);
  }
  if (hasDuplicates(values)) {
    fail(`initial config: duplicate ${name} URLs`);
  }
}

const requiredFiles = [
  'index.html',
  '404.html',
  'invite/index.html',
  'pair/index.html',
  'config/index.html',
  'privacy/index.html',
  'manifest.json',
  'favicon.png',
  'site.css',
  'site.js',
  'redirect.js',
  'initial-server-config-qr.svg',
  '.well-known/assetlinks.json',
  '.well-known/apple-app-site-association',
  'icons/Icon-192.png',
  'icons/Icon-512.png',
  'icons/Icon-maskable-192.png',
  'icons/Icon-maskable-512.png',
];

requiredFiles.forEach((file) => {
  if (!exists(file)) fail(`${file}: missing required file`);
});

const config = readJson('config/initial-server-config.json');
const generated = readJson('config/initial-server-config.generated.json');
const configAssetVersion = typeof generated?.payload === 'string'
  ? generated.payload.slice(0, 16)
  : '';
readJson('manifest.json');
const assetlinks = readJson('.well-known/assetlinks.json');
const aasa = readJson('.well-known/apple-app-site-association');

if (config) {
  if (config.type !== 'peerlink_server_config') fail('initial config: invalid type');
  if (config.version !== 1) fail('initial config: unsupported version');
  validateUrlList('bootstrap', config.bootstrap, isWebSocketUrl);
  validateUrlList('relay', config.relay, isHttpUrl);
  validateUrlList('push', config.push, isHttpUrl, { allowEmpty: true });
  if (!Array.isArray(config.turn)) {
    fail('initial config: TURN must be an array');
  } else {
    config.turn.forEach((entry, index) => {
      const turnUrl = typeof entry?.url === 'string' ? parseTurnUrl(entry.url) : null;
      if (!entry || !turnUrl?.valid) fail(`initial config: invalid TURN url at index ${index}`);
      if (typeof entry?.username !== 'string' || entry.username.length === 0) {
        fail(`initial config: invalid TURN username at index ${index}`);
      }
      if (typeof entry?.password !== 'string' || entry.password.length === 0) {
        fail(`initial config: invalid TURN password at index ${index}`);
      }
      if (typeof entry?.priority !== 'number' || !Number.isFinite(entry.priority)) {
        fail(`initial config: invalid TURN priority at index ${index}`);
      }
    });
    if (hasDuplicates(config.turn.map((entry) => entry?.url).filter(Boolean))) {
      fail('initial config: duplicate TURN URLs');
    }
  }
}

if (config && generated) {
  const expectedPayload = Buffer.from(canonical(config), 'utf8').toString('base64url');
  const expectedUrl = `https://simplegear.org/config?payload=${expectedPayload}`;
  if (generated.payload !== expectedPayload) fail('generated payload does not match canonical config');
  if (generated.url !== expectedUrl) fail('generated URL does not match canonical config');
  const decoded = JSON.parse(Buffer.from(generated.payload, 'base64url').toString('utf8'));
  if (canonical(decoded) !== canonical(config)) fail('generated payload does not decode to canonical config');
  if (generated.payload.length > maxPayloadLength) fail('generated payload exceeds client payload limit');
}

if (assetlinks) {
  const entries = Array.isArray(assetlinks) ? assetlinks : [];
  const androidTarget = entries.find((entry) => entry?.target?.namespace === 'android_app');
  if (androidTarget?.target?.package_name !== 'org.simplegear.peerlinkapp') {
    fail('assetlinks: package_name must be org.simplegear.peerlinkapp');
  }
  const fingerprints = androidTarget?.target?.sha256_cert_fingerprints;
  const fingerprintPattern = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
  if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
    fail('assetlinks: sha256_cert_fingerprints must be a non-empty array');
  } else if (fingerprints.some((fingerprint) => typeof fingerprint !== 'string' || !fingerprintPattern.test(fingerprint))) {
    fail('assetlinks: invalid SHA-256 fingerprint format');
  }
}

if (aasa) {
  const details = aasa?.applinks?.details;
  const expectedPaths = ['/invite*', '/pair*', '/config*'];
  const app = Array.isArray(details) ? details.find((entry) => entry?.appID === '36WZ459LJ7.org.simplegear.peerlinkapp') : null;
  if (!app) fail('AASA: missing expected appID');
  if (canonical(app?.paths) !== canonical(expectedPaths)) fail('AASA: unexpected applinks paths');
}

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(path.relative(root, absolute));
    }
  }
}
walk(root);

const localHrefPattern = /\s(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g;
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (!html.includes('<!DOCTYPE html>')) fail(`${file}: missing doctype`);
  if (html.includes('<script>')) fail(`${file}: inline script is not allowed`);
  if (!html.includes('http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0"')) {
    fail(`${file}: missing no-cache Cache-Control meta`);
  }
  if (!html.includes('http-equiv="Pragma" content="no-cache"')) fail(`${file}: missing no-cache Pragma meta`);
  if (!html.includes('http-equiv="Expires" content="0"')) fail(`${file}: missing no-cache Expires meta`);
  if (html.includes('site.js?v=') && !html.includes(`site.js?v=${assetVersion}`)) fail(`${file}: stale site.js version`);
  if (html.includes('site.css?v=') && !html.includes(`site.css?v=${assetVersion}`)) fail(`${file}: stale site.css version`);
  if (html.includes('initial-server-config-qr.svg') && !html.includes(`initial-server-config-qr.svg?v=${configAssetVersion}`)) {
    fail(`${file}: stale initial server config QR version`);
  }
  if (['invite/index.html', 'pair/index.html', 'config/index.html', 'invite.html', 'pair.html', 'config.html'].includes(file)) {
    if (!html.includes('content="noindex,nofollow"')) fail(`${file}: missing noindex,nofollow`);
    if (!html.includes('content="no-referrer"')) fail(`${file}: missing no-referrer`);
  }
  if (html.includes('Content-Security-Policy')) {
    if (html.includes('unsafe-inline') || html.includes('unsafe-eval') || html.includes('*')) {
      fail(`${file}: weak CSP directive found`);
    }
  }
  let match;
  while ((match = localHrefPattern.exec(html))) {
    const target = match[1].replace(/\/$/, '/index.html').replace(/^\//, '');
    if (!target || target.startsWith('.well-known/')) {
      if (target && !exists(target)) fail(`${file}: broken local reference /${target}`);
      continue;
    }
    if (!exists(target)) fail(`${file}: broken local reference ${match[1]}`);
  }
}

const siteJs = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
['innerHTML', 'eval(', 'new Function', 'document.write', 'sessionStorage'].forEach((pattern) => {
  if (siteJs.includes(pattern)) fail(`site.js: unsafe pattern found: ${pattern}`);
});
if (!siteJs.includes(String(maxPayloadLength)) || !siteJs.includes(String(maxPairDataLength))) {
  fail('site.js: payload size limits are not present');
}

const scanFiles = [];
function collectScanFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectScanFiles(absolute);
    } else if (entry.isFile() && !absolute.endsWith('scripts/validate-site.mjs')) {
      scanFiles.push(absolute);
    }
  }
}
collectScanFiles(root);

const fullTreeText = scanFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

[
  /BEGIN\s+PRIVATE\s+KEY/,
  /BEGIN\s+RSA\s+PRIVATE\s+KEY/,
  /AIza[0-9A-Za-z_-]{35}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[0-9A-Za-z-]+/,
].forEach((pattern) => {
  if (pattern.test(fullTreeText)) fail(`potential secret pattern found: ${pattern}`);
});

const qr = fs.readFileSync(path.join(root, 'initial-server-config-qr.svg'), 'utf8');
if (!qr.includes('Generated from config/initial-server-config.json')) {
  fail('initial-server-config-qr.svg: missing generated marker');
}
if (generated && !qr.includes(`data-generated-url="${generated.url.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)) {
  fail('initial-server-config-qr.svg: generated URL marker does not match generated config URL');
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Site validation passed');

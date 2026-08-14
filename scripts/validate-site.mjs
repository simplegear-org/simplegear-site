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
    return ['https:', 'http:'].includes(url.protocol) && validHost(url.hostname);
  } catch (_) {
    return false;
  }
}

function isTurnUrl(value) {
  const match = /^(turns?):([^:/?]+|\[[^\]]+\])(?::\d{1,5})?(?:\?transport=(udp|tcp))?$/.exec(value);
  return Boolean(match && validHost(match[2].replace(/^\[|\]$/g, '')));
}

function validHost(hostname) {
  return Boolean(hostname) && !hostname.includes('_') && !hostname.endsWith('.') && hostname !== 'localhost';
}

function canonical(value) {
  return JSON.stringify(value);
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
readJson('manifest.json');
readJson('.well-known/assetlinks.json');
readJson('.well-known/apple-app-site-association');

if (config) {
  if (config.type !== 'peerlink_server_config') fail('initial config: invalid type');
  if (config.version !== 1) fail('initial config: unsupported version');
  if (!Array.isArray(config.bootstrap) || config.bootstrap.some((url) => !isWebSocketUrl(url))) {
    fail('initial config: invalid bootstrap URLs');
  }
  if (!Array.isArray(config.relay) || config.relay.some((url) => !isHttpUrl(url))) {
    fail('initial config: invalid relay URLs');
  }
  if (!Array.isArray(config.push) || config.push.some((url) => !isHttpUrl(url))) {
    fail('initial config: invalid push URLs');
  }
  if (!Array.isArray(config.turn) || config.turn.some((entry) => (
    !entry ||
    !isTurnUrl(entry.url) ||
    typeof entry.username !== 'string' ||
    typeof entry.password !== 'string'
  ))) {
    fail('initial config: invalid TURN entries');
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
  if (html.includes('site.js?v=') && !html.includes(`site.js?v=${assetVersion}`)) fail(`${file}: stale site.js version`);
  if (html.includes('site.css?v=') && !html.includes(`site.css?v=${assetVersion}`)) fail(`${file}: stale site.css version`);
  if (['invite/index.html', 'pair/index.html', 'config/index.html'].includes(file)) {
    if (!html.includes('content="noindex,nofollow"')) fail(`${file}: missing noindex,nofollow`);
    if (!html.includes('content="no-referrer"')) fail(`${file}: missing no-referrer`);
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

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Site validation passed');

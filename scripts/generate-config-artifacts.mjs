import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const root = process.cwd();
const configPath = path.join(root, 'config', 'initial-server-config.json');
const qrPath = path.join(root, 'initial-server-config-qr.svg');
const generatedPath = path.join(root, 'config', 'initial-server-config.generated.json');

let config;
const configSource = fs.readFileSync(configPath, 'utf8');
if (!configSource.trim()) {
  console.error(`${path.relative(root, configPath)} is empty`);
  process.exit(1);
}
try {
  config = JSON.parse(configSource);
} catch (error) {
  console.error(`${path.relative(root, configPath)} is not valid JSON: ${error.message}`);
  process.exit(1);
}
const canonicalJson = JSON.stringify(config);
const payload = Buffer.from(canonicalJson, 'utf8').toString('base64url');
const url = `https://simplegear.org/config?payload=${payload}`;
const assetVersion = payload.slice(0, 16);

const generated = {
  source: 'config/initial-server-config.json',
  payload,
  url,
};

fs.writeFileSync(generatedPath, `${JSON.stringify(generated, null, 2)}\n`);

let svg = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: {
    dark: '#06111fff',
    light: '#ffffffff',
  },
});

svg = svg.replace(
  '<svg ',
  `<svg data-generated-from="config/initial-server-config.json" data-generated-url="${escapeXmlAttribute(url)}" `
);

fs.writeFileSync(
  qrPath,
  `<!-- Generated from config/initial-server-config.json. Do not edit manually. -->\n${svg}\n`
);

for (const relativeHtmlPath of ['index.html', path.join('invite', 'index.html')]) {
  const htmlPath = path.join(root, relativeHtmlPath);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const updated = html.replace(
    /src="\/initial-server-config-qr\.svg(?:\?v=[^"]*)?"/g,
    `src="/initial-server-config-qr.svg?v=${assetVersion}"`
  );
  fs.writeFileSync(htmlPath, updated);
}

console.log(`Generated ${path.relative(root, generatedPath)}, ${path.relative(root, qrPath)}, and QR cache-bust links`);

function escapeXmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

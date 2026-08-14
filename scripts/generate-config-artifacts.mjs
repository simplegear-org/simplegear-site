import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const root = process.cwd();
const configPath = path.join(root, 'config', 'initial-server-config.json');
const qrPath = path.join(root, 'initial-server-config-qr.svg');
const generatedPath = path.join(root, 'config', 'initial-server-config.generated.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const canonicalJson = JSON.stringify(config);
const payload = Buffer.from(canonicalJson, 'utf8').toString('base64url');
const url = `https://simplegear.org/config?payload=${payload}`;

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
  '<svg data-generated-from="config/initial-server-config.json" '
);

fs.writeFileSync(
  qrPath,
  `<!-- Generated from config/initial-server-config.json. Do not edit manually. -->\n${svg}\n`
);

console.log(`Generated ${path.relative(root, generatedPath)} and ${path.relative(root, qrPath)}`);

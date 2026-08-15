const maxPayloadLength = 65536;
const maxPairDataLength = 65536;
const payloadTypeToHost = Object.freeze({
  peerlink_account_pairing: 'pair',
  peerlink_invite: 'invite',
  peerlink_server_config: 'config',
});

const failures = [];

function fail(message) {
  failures.push(message);
}

function encodePayload(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function makeExactLimitPayload() {
  for (let size = 0; size < maxPayloadLength; size += 1) {
    const payload = encodePayload({ legacy: 'x'.repeat(size) });
    if (payload.length === maxPayloadLength) return payload;
    if (payload.length > maxPayloadLength) break;
  }
  throw new Error('failed to build exact-limit payload fixture');
}

function inspectPayload(rawPayload) {
  try {
    const parsed = JSON.parse(Buffer.from(rawPayload, 'base64url').toString('utf8'));
    return {
      valid: true,
      type: typeof parsed?.type === 'string' ? parsed.type : null,
    };
  } catch (_) {
    return {
      valid: false,
      type: null,
    };
  }
}

function resolveOpenLink({ linkKind, payload = null, pairingData = null }) {
  if (linkKind === 'pair' && pairingData) {
    if (pairingData.length > maxPairDataLength) return false;
    return `peerlink://pair?data=${encodeURIComponent(pairingData)}`;
  }
  if (!payload) return null;
  if (payload.length > maxPayloadLength) return false;
  return buildAppLinkFromPayload(linkKind, payload);
}

function buildAppLinkFromPayload(linkKind, rawPayload) {
  const payloadInfo = inspectPayload(rawPayload);
  if (!payloadInfo.valid) return false;

  const payloadType = payloadInfo.type;
  if (payloadType && !payloadTypeToHost[payloadType]) return false;
  if (linkKind === 'config' && payloadType !== 'peerlink_server_config') return false;
  if (linkKind === 'invite' && payloadType === 'peerlink_server_config') return false;

  const targetHost = payloadTypeToHost[payloadType] ?? (linkKind === 'pair' ? 'pair' : 'invite');
  return `peerlink://${targetHost}?payload=${encodeURIComponent(rawPayload)}`;
}

function expectHost(name, linkKind, payload, expectedHost) {
  const actual = resolveOpenLink({ linkKind, payload });
  if (typeof actual !== 'string' || !actual.startsWith(`peerlink://${expectedHost}?payload=`)) {
    fail(`${name}: expected peerlink://${expectedHost}, got ${actual}`);
  }
}

function expectInvalid(name, linkKind, payload) {
  const actual = resolveOpenLink({ linkKind, payload });
  if (actual !== false) fail(`${name}: expected invalid result, got ${actual}`);
}

expectHost('invite payload', 'invite', encodePayload({ type: 'peerlink_invite' }), 'invite');
expectHost('pairing payload', 'invite', encodePayload({ type: 'peerlink_account_pairing' }), 'pair');
expectHost('config payload', 'config', encodePayload({ type: 'peerlink_server_config' }), 'config');
expectHost('legacy typeless invite payload', 'invite', encodePayload({ legacy: true }), 'invite');

expectInvalid('config page rejects invite payload', 'config', encodePayload({ type: 'peerlink_invite' }));
expectInvalid('invite page rejects config payload', 'invite', encodePayload({ type: 'peerlink_server_config' }));
expectInvalid('unknown explicit payload type', 'invite', encodePayload({ type: 'peerlink_unknown' }));
expectInvalid('malformed base64 payload', 'invite', 'not***base64');
expectInvalid('invalid JSON payload', 'invite', Buffer.from('not json', 'utf8').toString('base64url'));
expectInvalid('oversized payload', 'invite', 'a'.repeat(maxPayloadLength + 1));

try {
  const exactLimitPayload = makeExactLimitPayload();
  expectHost('payload at exact limit', 'invite', exactLimitPayload, 'invite');
} catch (error) {
  fail(error.message);
}

const exactPairData = 'x'.repeat(maxPairDataLength);
const exactPairLink = resolveOpenLink({ linkKind: 'pair', pairingData: exactPairData });
if (typeof exactPairLink !== 'string' || !exactPairLink.startsWith('peerlink://pair?data=')) {
  fail('pair data at exact limit should be accepted');
}
if (resolveOpenLink({ linkKind: 'pair', pairingData: 'x'.repeat(maxPairDataLength + 1) }) !== false) {
  fail('pair data above limit should be rejected');
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Deep-link routing tests passed');

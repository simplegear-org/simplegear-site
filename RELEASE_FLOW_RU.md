# RELEASE FLOW

Обновлено: 2026-08-15

Внутренняя памятка по обновлению сайта SimpleGear и initial server
configuration для PeerLink X.

Этот файл не должен попадать в публичный сайт/зеркало. Он не подключен из HTML и
нужен только для локального release-процесса.

## 1. Единственная точка правды

Базовая конфигурация серверов задается только здесь:

```text
config/initial-server-config.json
```

Руками не править:

- `config/initial-server-config.generated.json`;
- `initial-server-config-qr.svg`;
- QR cache-bust ссылки в `index.html` и `invite/index.html`.

## 2. Обновление списка серверов

После замены bootstrap, relay, TURN или push endpoint-ов:

```bash
cd /Users/vladimir/peerlink_site
npm run check
git diff
```

`npm run check` автоматически:

- регенерирует `config/initial-server-config.generated.json`;
- регенерирует `initial-server-config-qr.svg`;
- обновляет QR cache-bust ссылки в HTML;
- проверяет, что payload, generated URL и QR соответствуют canonical JSON;
- проверяет deep-link routing.

## 3. TURN credentials

Для серверов, установленных актуальным `peerlink_servers/deploy.sh`, текущий
TURN compatibility contract:

```text
username: peerlink
password: peerlink
```

В `config/initial-server-config.json` не должен попадать случайно
сгенерированный TURN password из старого app deploy flow.

## 4. Кэш QR и ссылки

QR может часто меняться, поэтому:

- HTML содержит no-cache meta;
- QR подключается как `/initial-server-config-qr.svg?v=<payload-version>`;
- runtime-ссылка на конфиг строится из
  `/config/initial-server-config.json?v=<timestamp>`.

После изменения canonical JSON всегда запускать `npm run check`, чтобы version
query у QR обновился.

## 5. PR checklist

Перед PR:

```bash
npm run check
git diff
git status --short
```

В PR вместе коммитить:

- `config/initial-server-config.json`;
- `config/initial-server-config.generated.json`;
- `initial-server-config-qr.svg`;
- `index.html` и/или `invite/index.html`, если обновился QR cache-bust;
- scripts/README/package changes, если менялся generation flow.

CI должен выполнять:

```bash
npm ci
npm run check
git diff --exit-code
```

Если после `npm run check` остается diff, значит generated artifacts не были
закоммичены.

## 6. Самая короткая памятка

```text
1. Править только config/initial-server-config.json
2. npm run check
3. Проверить git diff
4. Закоммитить canonical JSON + generated JSON + QR + HTML cache-bust
5. Открыть PR и дождаться Validate site
```

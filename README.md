# iflow-cli

Lightweight CLI and library for managing SAP BTP Integration Suite Groovy script collections.

Features
- Sync local ScriptCollections/ with remote script collections (pull/push)
- Deploy script collections and associated iFlows
- Diff local vs remote collections
- Simple programmatic API for embedding into other tools

Install (from npm)

```bash
npm install -g iflow-cli
# or as dev dependency in a project
npm install --save-dev iflow-cli
```

Quickstart

1. Create configuration in your project root:
   - Preferred: `sapbtp.config.json`
   - Fallback: `iflow.config.json`
2. Create `.env` in the same root with `OAUTH_TOKEN_URL`, `CLIENT_ID`, `CLIENT_SECRET`.
3. Run CLI:

```bash
# show status
npx iflow-cli status

# pull script collection
npx iflow-cli pull --id <collectionId>
```

Configuration

Minimal `sapbtp.config.json` shape:

```json
{
  "btpBaseUrl": "https://<your-tenant>/api/v1",
  "scriptCollectionsDir": "ScriptCollections", // optional, defaults to ScriptCollections
  "collections": [
    { "id": "MyCollection", "name": "MyCollection", "iflowId": "MyIflow", "iflowVersion": "active" }
  ],
  "defaultVersion": "active"
}
```

`.env` variables (required):
- `OAUTH_TOKEN_URL`
- `CLIENT_ID`
- `CLIENT_SECRET`

CLI Commands (examples)

- `pull --id <collectionId>`: download scripts to local folder
- `push --id <collectionId>`: upload local scripts to remote
- `deploy --id <collectionId>`: trigger deploy; `--iflow` deploys associated iFlow
- `diff --id <collectionId>`: show unified diff, exit code 1 if changes
- `status`: list collections and statuses
- `init --id <collectionId> --name <displayName>`: scaffold local folder
- `version --id <collectionId> --new-version <version>`: save collection as version

Library API

The package exports a small runtime surface for programmatic use. Example:

```ts
import { createApiClient, loadConfig, runPullCommand } from 'iflow-cli';

const config = loadConfig();
const client = createApiClient(config.btpBaseUrl);
await runPullCommand(client, config, { id: 'MyCollection' });
```

Development

Build, typecheck, test locally:

```bash
npm ci
npm run build
npm run typecheck
npm test
```

Publishing

Package prepared to publish from `dist` (build runs in `prepack`). Verify with:

```bash
npm pack --dry-run
```

Troubleshooting

- If tests fail in CI with rolldown/Vitest errors, use Node.js 20 or newer in CI.
- Config loading: CLI resolves `sapbtp.config.json` first, then `iflow.config.json` fallback; `.env` loaded from project root.

Contributing

Open PRs against `main`. CI covers build, typecheck, tests, and `npm pack --dry-run`.

License

See `package.json` for license field.

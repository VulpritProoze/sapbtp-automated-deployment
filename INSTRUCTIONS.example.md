# iflow-cli — Example usage flow

This example shows a concrete, minimal flow for using `iflow-cli`: setting env vars, locating IDs, populating `ScriptCollections`, and running commands. Follow each step in order.

1) Prepare your environment
- Copy the example env and edit values locally. Do NOT commit your `.env`.

PowerShell:
```powershell
copy .env.example .env
# edit .env with your values (use a text editor)
```

Bash / macOS / Linux:
```bash
cp .env.example .env
# edit .env with your values (use nano, vim, or code)
```

2) What to put in `.env`
- `OAUTH_TOKEN_URL`: token endpoint for your tenant (example: `https://<tenant>.authentication.<region>.hana.ondemand.com/oauth/token`).
- `CLIENT_ID` and `CLIENT_SECRET`: obtain them from your BTP account (see next section).
- If your environment uses a separate API base URL, set `BTP_BASE_URL` in `.env` or in `iflow.config.json`.

3) Where to get `CLIENT_ID` / `CLIENT_SECRET` and URLs
- Log into the SAP BTP cockpit and open the target subaccount.
- To get credentials you can either:
  - Create an OAuth client under **Security / OAuth Clients** and record the client id/secret, or
  - Create a service instance for the Integration Suite and generate a **Service Key** (the key contains credentials). Both approaches supply a `client_id` and `client_secret`.
- For the token endpoint use the tenant-specific authentication host shown in the cockpit or in the service key JSON.

4) Finding the Script Collection `id`
- In Integration Suite (or your script-collection provider) open the Script Collections list. The collection `id` is shown in the UI (or in the REST API response). Use the same id in the CLI commands.
- You can also pre-configure collections in `iflow.config.json` under `collections` and then refer to their `id` when calling commands.

5) Populate `ScriptCollections`
- Create the local folder that will hold `.groovy` files for a collection. Files must be at the ZIP root (no nested folders).

PowerShell:
```powershell
mkdir -Force .\ScriptCollections\Scripts_MyCollection
# add your .groovy files into the folder
```

Bash:
```bash
mkdir -p ScriptCollections/Scripts_MyCollection
# add your .groovy files into the folder
```

6) Example commands (pull / push / deploy)
- Pull remote collection to local (overwrites local files):
```bash
npm run pull -- --id Scripts_MyCollection
```
- Push local files to remote script collection:
```bash
npm run push -- --id Scripts_MyCollection
```
- Deploy a collection (if supported by your environment):
```bash
npm run deploy -- --id Scripts_MyCollection
```

7) Commit workflow and pre-commit checks
- Before committing, stage the changes you want to include with `git add`.
- Use the built `/commit` skill via Copilot Chat (`/commit`) to run pre-commit checks, read recent commit history, and generate a Conventional Commits-compliant message. If coverage or lint checks fail, the skill will report failures and stop.

8) Running tests and coverage locally
- Run unit tests with coverage to inspect gaps:
```bash
npm run test -- --coverage
```
- If coverage is low, check that you have meaningful `.groovy` files in `ScriptCollections` and that test scaffolds are implemented (`src/__tests__`). Low coverage can result from empty collections or many `it.todo` placeholders.

9) Security reminders
- Never commit `.env` or real credentials. Keep `.env.example` in the repo with placeholders only.
- Use CI secrets or environment variables in your deployment pipeline rather than hard-coding real URLs or secrets in the repository.

10) Quick troubleshooting
- If CLI cannot reach BTP: check `BTP_BASE_URL` and VPN/network access.
- If auth fails: verify `CLIENT_ID`, `CLIENT_SECRET`, and `OAUTH_TOKEN_URL` are correct and that the client has correct scopes/roles.

If you want, I can also write a short sample `.env.example` snippet with placeholders or patch `iflow.config.json` to use a placeholder `btpBaseUrl` for public repos.

*** End of example instructions

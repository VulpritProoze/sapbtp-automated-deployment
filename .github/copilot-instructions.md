# iflow-cli

## Project purpose
iflow-cli is a TypeScript CLI that manages SAP BTP Integration Suite Groovy script collections. It syncs local .groovy files in ScriptCollections/ with remote script collection artifacts, automating pull, push, deploy, diff, status, init, and version workflows.

## Architecture overview
The code follows a layered flow:
- CLI entrypoint (src/cli.ts) wires commands and parses flags.
- Commands (src/commands/) orchestrate a single action and call into lower layers.
- API layer (src/api/) performs all HTTP calls using a shared axios client.
- Auth layer (src/auth/) fetches OAuth2 tokens with in-memory caching.
- ZIP layer (src/zip/) packages and extracts Groovy files.
- Config loader (src/config/) validates iflow.config.json and .env.
- Utils (src/utils/) contains shared logging and filesystem helpers.

## Key conventions
- All API calls go through src/api/client.ts and its exported helpers. Never call axios directly from commands.
- CSRF token must be pre-fetched via fetchCsrfToken helper before any PUT or POST.
- Config is loaded once at startup via loader.ts and passed down. Do not re-read config mid-command.
- All errors must surface with a user-friendly message via logger.ts. Avoid raw console.error.
- .env is never committed; .env.example is kept up to date.

## Adding a new command
1. Create a new file in src/commands/ with a runXCommand function.
2. Keep the command thin: assemble inputs, call API/ZIP/config helpers, handle logging.
3. Wire the command in src/cli.ts with commander options and a required --id if needed.
4. Add docs in docs/commands.md and update CLAUDE.md if behavior changes.
5. Run npm run lint and fix any errors.

## Adding a new API endpoint
1. Define request/response interfaces in src/api/<area>.ts.
2. Implement a typed function that accepts ApiClient and returns parsed data.
3. Use the axios instance from ApiClient. Do not create new axios clients.
4. If the endpoint mutates state, call fetchCsrfToken before the request.
5. Update docs/config-reference.md or docs/commands.md if public behavior changes.

## Testing approach
Manual testing steps per command:
- pull: ensure local files are overwritten and log lines are printed per file.
- push: upload after diff; confirm the remote artifact content changes.
- deploy: confirm script collection deploys; when --iflow is used, confirm iFlow deploy.
- diff: verify unified diff output and exit code 1 on changes.
- status: confirm the table lists each collection with a sensible status.
- init: verify folder creation, README.md, .gitkeep, and config update.
- version: verify the script collection is saved as a new version on BTP.
For unit tests later, mock axios in src/api and use fixture ZIPs for zip/handler.ts.

## File ownership map
- src/cli.ts: CLI definition and command registration.
- src/commands/: Orchestration for each CLI command.
- src/api/: SAP BTP API calls, CSRF handling, request/response typing.
- src/auth/oauth.ts: OAuth2 client credentials token fetch and cache.
- src/zip/handler.ts: ZIP encode/decode for .groovy files only.
- src/config/loader.ts: config and env loading and validation.
- src/utils/logger.ts: logging and IFlowError creation.
- src/utils/fs.ts: filesystem helpers for Groovy files.

## Agent config layout
The .claude/ folder is the single source of truth for agent configuration. Symlinks are not used in this repo, so provider configs are copies:
- .github/copilot-instructions.md is a copy of CLAUDE.md.
- .github/instructions contains copies of .claude/rules (including adr).
- AGENTS.md is a copy of CLAUDE.md.
Always edit CLAUDE.md or files under .claude/ first, then update the copies in .github/ and AGENTS.md.

# iflow-cli — Quick Onboarding

This document explains how to set up, run, and contribute to the `iflow-cli` repository. It's written for new teammates and interns; keep it nearby when getting started.

## Prerequisites
- Install Node.js 18+ and npm. Use the official installer for Windows.
- Clone the repository and open it in VS Code.

## Install dependencies
- From the repository root run `npm install` to install production and dev dependencies.
- Run `npm run typecheck` to validate TypeScript setup (may be relaxed during scaffolding).
- If ESLint or Prettier complain, run `npm run lint` and `npm run format`.

## Configuration
- Copy `.env.example` to `.env` and fill the values (client id, client secret, btpBaseUrl) if you will call live APIs.
- Keep `iflow.config.json` in the repo root to configure ScriptCollections mappings. The CLI reads it once at startup.

## ScriptCollections folder
- Create a `ScriptCollections/` folder at the project root (if missing). Each collection is a directory containing flat `.groovy` files.
- For each collection, add a `README.md` and a `.gitkeep` if needed. Files must be at the ZIP root when uploaded.
- The CLI commands assume `.groovy` files only — nested folders are not packaged into ZIPs.

## Common commands
- Use the explicit npm scripts that map to CLI commands:
	- `npm run pull -- --id <collectionId>` — run the `pull` command (example: `npm run pull -- --id Scripts_MyCollection`).
	- `npm run push -- --id <collectionId>` — run the `push` command.
	- `npm run deploy -- --id <collectionId>` — run the `deploy` command.
- Alternative direct invocation (bypasses npm scripts):
	- `npx ts-node src/cli.ts <command> -- --id <collectionId>`
- `npm run lint` runs ESLint; `npm run format` runs Prettier auto-fix.
- `npm run test` runs unit tests; use `npm run test -- --watch` for iterative development.

## Testing and coverage
- Tests use Vitest. Run `npm run test -- --coverage` to generate the `coverage/` report.
- Open `coverage/index.html` in a browser to inspect uncovered lines and files.
- Convert `todo` tests in `src/__tests__` to concrete cases to raise coverage incrementally.

## Agentic workflow & skills
- The `.claude/` folder contains canonical agent skills and rules. Copies live under `.github/` for provider tooling.
- Use the `lint-check`, `unit-test-check`, and `code-review` skills to automate QA steps. See `.claude/skills/*/SKILL.md` for detailed behavior.
- Update canonical files in `.claude/` and then propagate copies under `.github/` when required.

## Working with APIs
- All HTTP calls go through `src/api/client.ts`. Do not call `axios` directly from command files.
- Use `src/auth/oauth.ts` to obtain tokens; the client credentials flow is cached in memory for the CLI run.
- For mutating requests, call `fetchCsrfToken` before POST/PUT operations.

## Packaging and ZIPs
- ZIPs are produced by `src/zip/handler.ts` using `adm-zip`. ZIP contents must be flat and contain only `.groovy` files.
- The ZIP is base64url-encoded before upload. Tests should use in-memory fixtures rather than network calls.

## Contributing and tests
- Keep commands thin: command files orchestrate and call into `api/`, `zip/`, and `config/` layers.
- Add unit tests under `src/__tests__` and mock `src/api/client.ts` or `src/config/loader.ts` to isolate behavior.
- Run `npm run lint` and `npm run test` before opening a PR.

## Troubleshooting
- If `npm run lint` fails after install, run `npm run format` then re-run lint.
- If tests fail due to missing env vars, set a minimal `.env` with dummy values for local runs.

## Where to ask for help
- Open an issue or ping the repo maintainer in your team's chat with `#iflow-cli` in the subject.
- For questions about agent skills, refer to `.claude/skills/*/SKILL.md` or ask the person who configured the agents.

Enjoy exploring the repo — happy hacking!

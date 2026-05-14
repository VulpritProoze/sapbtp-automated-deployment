# Testing strategy

## Tier 1 -- Static analysis (already in place)
- ESLint with @typescript-eslint for type-aware linting.
- Prettier for formatting consistency.
- Typecheck gate: run tsc --noEmit via npm run typecheck.

## Tier 2 -- Unit tests with Vitest (implement now)
Use Vitest with @vitest/coverage-v8 and mock all external dependencies.

Mocking strategy:
- Use vi.mock on src/api/client.ts to control SAP BTP responses with no network dependency.
- Use vi.mock('fs') or memfs to avoid touching the real filesystem.

Coverage targets:
- Statements >= 70%
- Branches >= 60%
- Functions >= 80%
- Lines >= 70%

Test focus areas:
- Happy path: correct ZIP encoded, correct endpoint called, correct params passed.
- Error paths: 401 Unauthorized -> token refresh attempted; 404 -> friendly error; network timeout -> VPN message.
- Edge cases: empty ScriptCollections folder on push; ZIP with no .groovy files on pull; config missing iflowId when --iflow flag is passed to deploy.

What not to test at this tier:
- Do not test axios internals.
- Do not test adm-zip internals.
- Only test behavior of this code with mocked responses.

## Tier 3 -- Contract tests (future, not implemented now)
A contract test validates that the TypeScript interfaces match SAP BTP response shapes.

Proposed approach:
1. Define a Zod schema for each SAP BTP response shape (metadata, ZIP binary, deploy response).
2. In a contract test, make a real call to BTP (or replay a recorded response), and parse it through the schema.
3. If schema parsing fails, the contract is broken and interfaces need updates.

This catches cases where the interface expects Id but the API returns id (lowercase). Add this tier when a sandboxed BTP tenant is available.

## Tier 4 -- End-to-end smoke test (future, not implemented now)
A single scripts/smoke-test.sh should:
1. Run npm run pull -- --id Scripts_SAPtoWEBPOS against a real BTP sandbox tenant.
2. Assert that at least one .groovy file now exists locally.
3. Run npm run status and assert output contains "✓".
4. Run npm run diff -- --id Scripts_SAPtoWEBPOS and assert exit code 0.

Gate this in CI only on the main branch, not on every PR.

## CI pipeline recommendation
Proposed GitHub Actions workflow (.github/workflows/ci.yml) job order:
1. typecheck: tsc --noEmit
2. lint: npm run lint
3. format-check: npx prettier --check "src/**/*.ts"
4. unit-test: npx vitest run --coverage (enforce coverage thresholds)
5. smoke-test: only on main; requires BTP_SANDBOX_* secrets

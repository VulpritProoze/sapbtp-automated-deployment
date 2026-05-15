---
name: bug-fix
description: >
  /bug-fix orchestrated bug-fix workflow for iflow-cli. Before touching any code,
  runs /code-review on the user-defined scope, then gates on /lint-check and
  /unit-test-check. Only commits if all gates pass. Invoke with /bug-fix on any
  file, selection, or described symptom.

  Quick reference:

  | Step | Action | Halt rule |
  | --- | --- | --- |
  | 1 | Resolve scope (file / selection / symptom) | Halt if ambiguous until user confirms |
  | 2 | /code-review | Halt on any ❌ error |
  | 3 | /lint-check | Halt on any lint error |
  | 4 | /unit-test-check | Halt on any test failure |
  | 5 | Apply minimal fix | Only after all gates pass |
  | 6 | Re-verify lint + tests silently | Halt on any regression |
  | 7 | /commit | Only after fix is clean |

  At any HALT, the agent stops, reports, and waits for human resolution. The
  agent never skips a gate and never auto-merges on failure.
---

You are performing an orchestrated bug-fix workflow for iflow-cli. Follow the gate
chain exactly and stop immediately at the first failure. Never edit code before
Gate 1 passes.

## Full workflow

```text
/bug-fix workflow:
┌─────────────────────────────────────────────────────┐
│ 1. Resolve scope (file / selection / symptom)       │
│ 2. /code-review   → HALT if ❌ errors               │
│ 3. /lint-check    → HALT if lint errors             │
│ 4. /unit-test-check → HALT if test failures         │
│ 5. Apply minimal fix                                │
│ 6. Re-verify lint + tests silently                  │
│ 7. /commit with structured message                  │
└─────────────────────────────────────────────────────┘
At any HALT, the agent stops, reports, and waits for human resolution.
The agent never skips a gate, never auto-merges on failure.
```

## Trigger and scope resolution

When the user invokes `/bug-fix`, first resolve the scope of the fix. If scope is
ambiguous, ask the user to choose one of these:

1. FILE scope — a single file path (for example `src/commands/deploy.ts`)
2. SELECTION scope — a highlighted code block or line range (for example lines 42-87
   of `deploy.ts`)
3. SYMPTOM scope — a described bug (for example `CSRF token not being sent on re-deploy`)

If scope is a symptom, trace it to the likely file(s) using iflow-cli layer
conventions:

- `src/commands/` → CLI entry points
- `src/api/` → HTTP and SAP BTP interactions
- `src/config/` → env and config loading
- `src/utils/` → shared utilities

Confirm the resolved file(s) with the user before proceeding. Output exactly:

```text
Resolved scope to: <file(s)>. Proceeding with /code-review.
```

## Gate 1 — /code-review (mandatory, runs first, before any edit)

Invoke the existing code-review skill on the resolved scope. The code-review skill
enforces the following checks verbatim:

### Layer violation checks (errors)
- Any import of axios or use of axios.get/post/put outside src/api/client.ts.
- Any fs.*, path.*, or adm-zip usage inside src/commands/.
- Any require('dotenv') or process.env access outside src/config/loader.ts.
- Any hardcoded URL strings containing .hana.ondemand.com or /api/v1 outside config.
- Any console.log or console.error; use logger.ts instead.

### SAP BTP domain correctness checks (errors)
- Any PUT/POST to SAP BTP endpoints that does not include a CSRF token fetch beforehand.
- Any ZIP creation that stores files in subdirectories (must be flat at ZIP root).
- Any base64 encoding that uses standard base64 instead of base64url.
- Any Version parameter hardcoded to a string other than 'active' without a comment explaining why.
- Any ArtifactContent field that is not explicitly typed as string in the request body interface.

### TypeScript strictness checks
- any types without a // TODO: comment explaining the exception.
- Missing return type annotations on exported functions.
- Unhandled promise rejections (.then() without .catch(), or async functions without try/catch).
- Type assertions (as SomeType) without a comment justifying the cast.

### Security hygiene checks
- Any .env variable accessed directly via process.env outside loader.ts.
- Any credential-shaped string literal (client_id, client_secret, Bearer <token>, token-like strings).
- Any console.log that might print objects containing auth tokens or credentials.

### Review output format
Use this exact structure and include line numbers:

```text
## Code Review: <filename>

### ❌ Errors (must fix before merge)
- [LAYER] <description> — line <n>
- [DOMAIN] <description> — line <n>

### ⚠️ Warnings (should fix)
- [TS] <description> — line <n>
- [SEC] <description> — line <n>

### ✅ Looks good
- <what was done correctly>

### 💡 Suggestions (optional improvements)
- <suggestion>
```

If there are zero errors and zero warnings, say exactly: `No issues found — ready to merge.`

### Gate 1 pass condition
- Zero errors (❌). Warnings (⚠️) are logged but do not block.

### Gate 1 fail behavior
- Output the full code-review report.
- Output exactly: `🚫 HALTED at /code-review — fix all ❌ errors before the bug-fix can proceed.`
- Do NOT apply any fix. Do NOT run lint or tests. STOP.

### Gate 1 pass output
- Output: `✅ /code-review passed — 0 errors. Proceeding to /lint-check.`

## Gate 2 — /lint-check (runs after /code-review passes)

Run the /lint-check skill as defined in the repository. Do not redefine its logic —
invoke it as-is.

### Gate 2 pass condition
- Lint exits with code 0. Zero lint errors.

### Gate 2 fail behavior
- Output the full lint error list with file paths and line numbers.
- Output exactly: `🚫 HALTED at /lint-check — resolve all lint errors before proceeding.`
- Do NOT apply any fix. Do NOT run tests. STOP.

### Gate 2 pass output
- Output: `✅ /lint-check passed. Proceeding to /unit-test-check.`

## Gate 3 — /unit-test-check (runs after /lint-check passes)

Run the /unit-test-check skill as defined in the repository. Do not redefine its logic —
invoke it as-is.

### Gate 3 pass condition
- All existing unit tests pass. Zero test failures. Zero test errors.

### Gate 3 fail behavior
- Output the full test failure report with test names, file paths, and assertion diffs.
- Output exactly: `🚫 HALTED at /unit-test-check — all tests must pass before the fix is applied.`
- Do NOT apply any fix. Do NOT commit. STOP.

### Gate 3 pass output
- Output: `✅ /unit-test-check passed. All gates cleared — applying bug fix now.`

## Fix application

Apply the minimal, targeted fix to resolve the described bug. Follow these constraints strictly:

### What to change
- Fix only what is causally related to the described bug.
- Do not refactor unrelated code, rename variables, or reformat files.
- Do not introduce new dependencies not already in package.json.

### Layer enforcement during fix
- Respect iflow-cli layer conventions at all times (same rules as /code-review).
- If the fix requires a new utility, place it in `src/utils/` and export it properly.
- If the fix touches HTTP calls, ensure CSRF token fetch is included for PUT/POST.

### After applying fix
- Re-run /lint-check silently. If it fails, auto-correct lint issues introduced by the fix only, then re-run once more. If it still fails, HALT and report.
- Re-run /unit-test-check silently. If any test now fails that previously passed, HALT and report: `🚫 Fix introduced a regression in <test name>. Rolling back.`
- If both pass, output a fix summary:

```text
## Fix Summary
- File(s) changed: <list>
- Root cause: <one sentence>
- Fix applied: <one sentence>
- Lines changed: <n>
- Tests still passing: ✅
- Lint clean: ✅
```

## Gate 4 — /commit (runs only after fix is verified clean)

Invoke the /commit skill as defined in the repository. Do not redefine its logic —
invoke it as-is.

The commit message MUST follow this format:

```text
fix(<scope>): <imperative description of what was fixed>

- Root cause: <one sentence>
- Files changed: <comma-separated list>
- Gates passed: /code-review ✅ /lint-check ✅ /unit-test-check ✅

Refs: <issue number if provided by user, else omit>
```

### Commit scope rules
- Use the layer name as scope: commands, api, config, utils
- Example: `fix(api): ensure CSRF token is fetched before PUT to BTP runtime`

### Gate 4 fail behavior
- If /commit fails for any reason (merge conflict, hook failure, etc.), output the error verbatim.
- Output exactly: `🚫 /commit failed — fix the above and re-run /commit manually.`
- Do NOT retry automatically.

## Output requirements

The skill you generate must:
1. Be valid YAML frontmatter + Markdown body (same format as the code-review skill provided).
2. Reference /lint-check and /unit-test-check by their repo-defined names only — do not inline their logic.
3. Reference the code-review rules verbatim from the code-review skill — do not paraphrase.
4. Be directly usable in both Claude agent (claude.ai / Claude Code) and GitHub Copilot agent (via .github/copilot-instructions.md or .copilot/skills/).
5. Include the full workflow summary table inside the skill's description block for quick in-context reference.
6. Be self-contained: a developer reading only this skill file must understand the full gate chain, halt conditions, and commit format without reading other files.

---
name: bug-fix
description: >
  Lightweight /bug-fix workflow for iflow-cli. Resolves scope, runs an inline
  /code-review, applies a minimal targeted fix, and commits. No /lint-check or
  /unit-test-check sub-skills required. Invoke with /bug-fix on any file,
  selection, or described symptom.

  Quick reference:

  | Step | Action                          | Halt rule                          |
  | ---- | ------------------------------- | ---------------------------------- |
  | 1    | Resolve scope                   | Halt if ambiguous until confirmed  |
  | 2    | Inline code-review              | Halt on any ❌ error               |
  | 3    | Apply minimal fix               | Only after review passes           |
  | 4    | /commit                         | Only after fix is verified clean   |

  At any HALT, the agent stops, reports, and waits for human resolution.
  The agent never skips a gate and never auto-merges on failure.
---

You are performing a lightweight bug-fix workflow for iflow-cli. Follow the gate
chain exactly and stop at the first failure. Never edit code before Gate 1 passes.

## Full Workflow

```text
/bug-fix workflow:
┌───────────────────────────────────────────────────┐
│ 1. Resolve scope (file / selection / symptom)     │
│ 2. Inline code-review  → HALT if ❌ errors        │
│ 3. Apply minimal fix                              │
│ 4. /commit with structured message               │
└───────────────────────────────────────────────────┘
At any HALT, the agent stops, reports, and waits for human resolution.
The agent never skips a gate, never auto-merges on failure.
```

## Trigger and Scope Resolution

When the user invokes `/bug-fix`, resolve the scope of the fix first. If scope is
ambiguous, ask the user to choose one of:

1. **FILE scope** — a single file path (e.g. `src/commands/deploy.ts`)
2. **SELECTION scope** — a highlighted code block or line range (e.g. lines 42–87 of `deploy.ts`)
3. **SYMPTOM scope** — a described bug (e.g. `CSRF token not being sent on re-deploy`)

If scope is a symptom, trace it to the likely file(s) using iflow-cli layer conventions:

- `src/commands/` → CLI entry points
- `src/api/` → HTTP and SAP BTP interactions
- `src/config/` → env and config loading
- `src/utils/` → shared utilities

Confirm the resolved file(s) with the user before proceeding. Output exactly:

```text
Resolved scope to: <file(s)>. Proceeding with inline code-review.
```

## Gate 1 — Inline Code Review (mandatory, runs before any edit)

Perform the following checks directly on the resolved scope. Include line numbers
in all findings.

### Layer Violation Checks (Errors)
- axios or axios.get/post/put used outside `src/api/client.ts`
- `fs.*`, `path.*`, or `adm-zip` used inside `src/commands/`
- `require('dotenv')` or `process.env` accessed outside `src/config/loader.ts`
- Hardcoded URLs containing `.hana.ondemand.com` or `/api/v1` outside config
- `console.log` or `console.error` used anywhere (must use `logger.ts`)

### SAP BTP Domain Correctness Checks (Errors)
- PUT/POST to SAP BTP endpoints without a preceding CSRF token fetch
- ZIP creation storing files in subdirectories (must be flat at ZIP root)
- `base64` encoding using standard base64 instead of `base64url`
- `Version` parameter hardcoded to anything other than `'active'` without an explanatory comment
- `ArtifactContent` field not explicitly typed as `string` in the request body interface

### TypeScript Strictness Checks (Warnings)
- `any` types without a `// TODO:` comment explaining the exception
- Missing return type annotations on exported functions
- Unhandled promise rejections (`.then()` without `.catch()`, or `async` without `try/catch`)
- Type assertions (`as SomeType`) without a justifying comment

### Security Hygiene Checks (Warnings)
- `.env` variables accessed via `process.env` outside `loader.ts`
- Credential-shaped string literals (`client_id`, `client_secret`, `Bearer <token>`)
- `console.log` calls that may print objects containing auth tokens or credentials

### Review Output Format

```text
## Code Review: <filename>

### ❌ Errors (must fix before merge)
- [LAYER] <description> — line <n>
- [DOMAIN] <description> — line <n>

### ⚠️ Warnings (should fix)
- [TS] <description> — line <n>
- [SEC] <description> — line <n>

### ✅ Looks Good
- <what was done correctly>
```

If there are zero errors and zero warnings, output exactly:
`No issues found — proceeding to fix.`

### Gate 1 Pass Condition
Zero ❌ errors. Warnings are logged but do not block.

### Gate 1 Fail Behavior
- Output the full review report.
- Output exactly: `🚫 HALTED at code-review — fix all ❌ errors before the bug-fix can proceed.`
- Do NOT apply any fix. STOP.

### Gate 1 Pass Output
Output: `✅ Code review passed — 0 errors. Applying bug fix now.`

## Fix Application

Apply the minimal, targeted fix to resolve the described bug. Adhere strictly to
the following constraints.

### What to Change
- Fix only what is causally related to the described bug.
- Do not refactor unrelated code, rename variables, or reformat files.
- Do not introduce new dependencies not already in `package.json`.

### Layer Enforcement During Fix
- Respect iflow-cli layer conventions at all times (same rules as Gate 1).
- If the fix requires a new utility, place it in `src/utils/` and export it properly.
- If the fix touches HTTP calls, ensure CSRF token fetch is included for PUT/POST.

### After Applying Fix
Output a fix summary:

```text
## Fix Summary
- File(s) changed: <list>
- Root cause: <one sentence>
- Fix applied: <one sentence>
- Lines changed: <n>
```

## Gate 2 — /commit (runs only after fix summary is produced)

Invoke the `/commit` skill as defined in the repository. Do not redefine its logic —
invoke it as-is.

The commit message MUST follow this format:

```text
fix(<scope>): <imperative description of what was fixed>

- Root cause: <one sentence>
- Files changed: <comma-separated list>
- Gate passed: code-review ✅

Refs: <issue number if provided by user, else omit>
```

### Commit Scope Rules
Use the layer name as scope: `commands`, `api`, `config`, `utils`

Example: `fix(api): ensure CSRF token is fetched before PUT to BTP runtime`

### Gate 2 Fail Behavior
- Output the error verbatim.
- Output exactly: `🚫 /commit failed — fix the above and re-run /commit manually.`
- Do NOT retry automatically.

## Guardrails
- Never apply a fix before Gate 1 completes with zero errors.
- Do not run or reference /lint-check or /unit-test-check — they are out of scope for this workflow.
- Do not refactor, reformat, or rename anything outside the causal fix path.
- If the scope cannot be confidently resolved from a symptom description, HALT and ask — do not guess.
- If the fix would require touching more than 3 files, flag this to the user and ask whether to proceed or split into separate `/bug-fix` invocations.

## Tools Available
- File access — read `src/api/client.ts`, `src/config/loader.ts`, and related files
  to validate cross-file layer compliance during Gate 1
- Web search — look up unfamiliar SAP BTP API behaviors or TypeScript edge cases if needed

## Target Agents
- **Claude** — run the full Gate 1 → Fix → Gate 2 pipeline; produce all structured outputs
- **GitHub Copilot** — enforce Gate 1 inline during suggestion; apply fix only after
  review passes; invoke /commit as the final step
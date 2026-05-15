---
name: lint-check
description: Runs ESLint and Prettier checks on iflow-cli source files and reports all violations with fix instructions. Invoke with /lint-check before committing.
---

You run lint and formatting checks for iflow-cli and report actionable fixes.

## What you must do
1. Run npm run lint and capture the full output.
2. Run npx prettier --check "src/**/*.ts" and capture the output.
3. For each violation, report: file path, line number, rule name, violation message, and the exact fix (corrected code snippet or npm run format for formatting issues).
4. Group output by file, not by rule.
5. End with:
   - Lint: PASS / FAIL (N errors, M warnings)
   - Format: PASS / FAIL (N files need formatting)

## Auto-fix behavior
- If all violations are formatting-only (Prettier), you may run npm run format and report what changed.
- If there are ESLint errors, do not auto-fix; report them and wait for user confirmation before running eslint --fix.
- Never auto-fix ESLint @typescript-eslint rules.

## Project-critical rules (treat as errors)
- @typescript-eslint/no-explicit-any
- @typescript-eslint/explicit-function-return-type
- no-console
- @typescript-eslint/no-floating-promises

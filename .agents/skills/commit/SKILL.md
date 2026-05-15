---
name: commit
description: /commit — Generate a Conventional Commits message after running pre-commit checks (/lint-check and /unit-test-check). Invoke with /commit.
---

This skill generates a Conventional Commits-compliant commit message for the current staged changes, but only after running required pre-commit checks. Follow the steps exactly and never skip the checks.

1) Pre-commit checks
- Run the `lint-check` skill (invoke it as a sub-skill `/lint-check`). Capture its full result.
- Run the `unit-test-check` skill (invoke it as a sub-skill `/unit-test-check`). Capture its full result.
- If either sub-skill reports failure or a gate failure (lint errors or coverage gate fail), stop immediately and report the failure clearly with actionable next steps. Do not proceed to read history or generate a commit message.

2) Read commit history
- Run `git log --oneline -20` to fetch the last 20 commits.
- Use this history to learn the team's type vocabulary (feat, fix, chore, docs, refactor, perf, ci, test, build), common scopes, and short description style.
- Summarize observed patterns in one line (e.g., "team prefers `feat(scope): short-description` and uses scope `zip` frequently").

3) Inspect staged changes
- Run `git diff --staged` to get the staged diff.
- Identify the primary change (single-concern) and any secondary concerns. If multiple independent concerns exist, note them and prefer creating multiple commits; recommend splitting when appropriate.

4) Generate commit message (Conventional Commits)
- Produce a message in the exact format: `type(scope): short description`
- `type` must be chosen from the project's common types observed in history. If unsure, prefer `chore` for infra/CI, `fix` for bug fixes, `feat` for user-facing features, `test` for tests, `docs` for documentation, `refactor` for internal refactors.
- `scope` should match the most-specific module or folder affected (e.g., `zip`, `api`, `commands/push`); prefer existing scopes observed in history. If no clear scope, omit the scope (use `type: description`).
- `short description` must be imperative, lowercase, and <= 72 characters. Avoid trailing punctuation.

5) Body rules (required)
- Never produce a commit without a body. Always include a body following the header.
- For simple, single-concern commits: include a one-line body that succinctly states *why* the change was made (not what). Example: `Fix incorrect base64 encoding used by ZIP uploads.`
- For complex commits (multiple concerns, non-obvious side effects, or breaking changes): include a multi-line body with one short paragraph per concern. Use bullet points to clarify side effects, migration steps, or backward-incompatible changes.
- If the commit introduces a breaking change, include a `BREAKING CHANGE:` paragraph describing the change and migration steps.

6) Safety and constraints
- Never skip pre-commit checks, even if asked. If pre-commit checks fail, present the failures and stop.
- Never generate a commit without a body.
- Do not modify staged files; only read `git diff --staged` and `git status`.
- Mask nothing: show the full proposed commit message (header + body) verbatim to the user.

7) Approval flow
- Present the proposed commit message in a clearly delimited block.
- Provide a brief rationale (1–2 sentences) tying the message to the staged diff and recent history patterns.
- Offer these user actions: `Approve and commit`, `Edit message`, or `Abort`.
- If user chooses `Approve and commit`, run `git commit -m "<header>" -m "<body>"` (preserve body newlines). Then show the resulting `git log --oneline -1` entry.
- If user chooses `Edit message`, accept the edited message, validate it still has a body and matches Conventional Commits format, then run the commit command above.
- If user chooses `Abort`, do nothing and report that no commit was created.

8) Output requirements
- Show the results of the pre-commit checks (pass/fail), and include relevant excerpts if they failed.
- Show the last 20 commits summary (one-line per commit) you used to infer style.
- Show a concise summary of the staged diff's primary change (one sentence).
- Show the full proposed commit message (header + body) in a fenced block.
- Show the short rationale (1–2 sentences) linking history+difference → chosen type/scope/description.
- After commit, show the new top-of-log entry (`git log --oneline -1`).

9) Examples (do not assume these apply; always infer from history)
- Simple: `fix(zip): use base64url for zip payload`\n\n`Ensure ZIPs are encoded with base64url to avoid unsafe URL characters.`
- Complex: `feat(commands/push): add dry-run flag and validation`\n\n`Add --dry-run to allow previewing uploads without sending requests.`\n\n`- Validate config before packing`\n`- Report diff summary to user`

10) Final notes
- Be conservative: if staged changes include multiple unrelated concerns, recommend creating multiple commits and offer a suggested split.
- Keep messages short and actionable. Always adhere to the project's observed vocabulary and scope patterns.

*** End of skill***

---
name: commit
description: /commit — Generate a Conventional Commits message after running pre-commit checks. Copied from .claude/skills/commit/SKILL.md for Copilot.
---

Use the `/commit` skill to run pre-commit checks, read recent history, inspect staged changes, and produce a Conventional Commits-compliant message with a required body. Follow the same steps and constraints as the canonical skill.

Invoke this prompt as `/commit` in Copilot environments; if pre-commit checks fail, report failures and stop. Present the full proposed commit message for user approval before committing.

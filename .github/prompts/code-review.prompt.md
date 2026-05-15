---
name: Code Review
description: Invoke the code-review skill to run /lint-check and /unit-test-check, perform domain checks, and produce a unified review.
---

Use `/review <file or selection>` to trigger the orchestrator. It will call `/lint-check` and `/unit-test-check`, run project-specific domain checks, and return a structured review report.

Follow the prompts to provide the target file path or code selection.

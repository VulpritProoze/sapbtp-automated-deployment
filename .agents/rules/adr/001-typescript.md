# ADR 001: TypeScript

## Status
Accepted

## Context
This CLI integrates multiple HTTP calls, ZIP handling, and filesystem operations. Bugs from mismatched shapes or missing fields can cause failed deployments.

## Decision
Use TypeScript in strict mode.

## Rationale
- Strict typing catches missing config fields, API response shape changes, and null handling.
- Type definitions make it safer to reuse shared helpers across commands.
- Editor tooling improves maintainability for a growing CLI.

## Consequences
- Developers must satisfy the compiler for all new code.
- Type interfaces are required for API responses and config objects.

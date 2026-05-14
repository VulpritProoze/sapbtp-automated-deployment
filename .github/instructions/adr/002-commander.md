# ADR 002: commander

## Status
Accepted

## Context
The CLI needs predictable subcommands, flags, and help output with minimal overhead.

## Decision
Use commander as the CLI framework.

## Rationale
- Stable API with good TypeScript support.
- Simple subcommand registration for pull, push, deploy, diff, status, and init.
- Small footprint and no heavy scaffolding requirements.

## Consequences
- Command definitions live in src/cli.ts with thin command handlers.

# ADR 003: OAuth2 client credentials

## Status
Accepted

## Context
SAP BTP Integration Suite requires an OAuth2 access token for API calls.

## Decision
Use the OAuth2 client credentials flow and cache the access token in memory.

## Rationale
- No user interaction is required for automation.
- Tokens are short lived and can be reused within a single CLI invocation.
- Avoid persisting tokens to disk for security and simplicity.

## Consequences
- Every CLI run fetches a token on first use.
- Token cache expires based on expires_in with a safety skew.

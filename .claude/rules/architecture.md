# Architecture rules

## Layering
- Commands are thin orchestrators. No HTTP, ZIP, or filesystem logic inside command files.
- The api/ layer is stateless. It receives a pre-built ApiClient, does one thing, and returns typed data.
- zip/handler.ts is the only place that touches ZIP encoding or decoding.
- config/loader.ts is the only place that reads iflow.config.json or .env.

## Flow
cli.ts -> commands -> api/auth/zip/config -> utils

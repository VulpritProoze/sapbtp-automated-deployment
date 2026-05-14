# API conventions

- Name API functions with verb + noun (example: downloadScriptCollection, deployIflow).
- Always type request params and response shapes with TypeScript interfaces.
- CSRF token is always fetched via fetchCsrfToken helper in api/client.ts.
- Base URL and auth are injected via the axios instance. Never hardcode them.

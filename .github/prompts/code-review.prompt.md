---
name: code-review
description: Domain-aware architecture and correctness review for iflow-cli. Checks layer violations, SAP BTP API usage, TypeScript strictness, and security hygiene. Invoke with /review on any file or selection.
---

You are performing a domain-aware code review for iflow-cli. Enforce the checks below and report findings in the required format.

## Layer violation checks (errors)
- Any import of axios or use of axios.get/post/put outside src/api/client.ts.
- Any fs.*, path.*, or adm-zip usage inside src/commands/.
- Any require('dotenv') or process.env access outside src/config/loader.ts.
- Any hardcoded URL strings containing .hana.ondemand.com or /api/v1 outside config.
- Any console.log or console.error; use logger.ts instead.

## SAP BTP domain correctness checks (errors)
- Any PUT/POST to SAP BTP endpoints that does not include a CSRF token fetch beforehand.
- Any ZIP creation that stores files in subdirectories (must be flat at ZIP root).
- Any base64 encoding that uses standard base64 instead of base64url.
- Any Version parameter hardcoded to a string other than 'active' without a comment explaining why.
- Any ArtifactContent field that is not explicitly typed as string in the request body interface.

## TypeScript strictness checks
- any types without a // TODO: comment explaining the exception.
- Missing return type annotations on exported functions.
- Unhandled promise rejections (.then() without .catch(), or async functions without try/catch).
- Type assertions (as SomeType) without a comment justifying the cast.

## Security hygiene checks
- Any .env variable accessed directly via process.env outside loader.ts.
- Any credential-shaped string literal (client_id, client_secret, Bearer <token>, token-like strings).
- Any console.log that might print objects containing auth tokens or credentials.

## Review output format
Use this exact structure and include line numbers:

```
## Code Review: <filename>

### ❌ Errors (must fix before merge)
- [LAYER] <description> — line <n>
- [DOMAIN] <description> — line <n>

### ⚠️ Warnings (should fix)
- [TS] <description> — line <n>
- [SEC] <description> — line <n>

### ✅ Looks good
- <what was done correctly>

### 💡 Suggestions (optional improvements)
- <suggestion>
```

If there are zero errors and zero warnings, say exactly: "No issues found — ready to merge."

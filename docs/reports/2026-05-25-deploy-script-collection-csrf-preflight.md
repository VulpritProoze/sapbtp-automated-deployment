# Deploy Script Collection CSRF Preflight Report

## Symptom
`npm run deploy -- --id ITGWEPOSSAPINTEGRATION3_Scripts` fails with:

`Failed to fetch CSRF token for script collection deploy ITGWEPOSSAPINTEGRATION3_Scripts via DeployScriptCollectionDesigntimeArtifact (Version=active)`

## Finding
Root cause is in deploy API preflight. Baseline code calls `fetchCsrfToken` for `DeployScriptCollectionDesigntimeArtifact` without the function-import query params that the deploy endpoint requires.

The deploy request needs `Id` and `Version` query params. Without them, CSRF GET can fail before POST starts, so command reports a CSRF error instead of a deploy error.

## Evidence
- [src/api/scriptCollections.ts](src/api/scriptCollections.ts#L107) contains deploy flow and endpoint string.
- [src/api/scriptCollections.ts](src/api/scriptCollections.ts#L112) builds `Id` and `Version` params for the function import.
- [src/api/scriptCollections.ts](src/api/scriptCollections.ts#L120) sends those params into `fetchCsrfToken` in current tree; baseline behavior described above failed because this preflight did not carry them.
- [src/commands/deploy.ts](src/commands/deploy.ts#L13) always calls `deployScriptCollection` first, so this failure blocks deploy before any iFlow step.
- Repository note from prior investigation is not the active cause here; endpoint spelling is already `DeployScriptCollectionDesigntimeArtifact` in current code.

## Impact
All deploy attempts for script collections on the affected baseline can fail immediately during CSRF fetch.

## Recommendation
Keep deploy CSRF preflight on the same function-import URL as the POST request, including `Id` and `Version`, and keep the error text that distinguishes CSRF fetch from deploy POST.

## Investigation Update (latest run)

Observed preflight logs:

- `Deploy preflight: fetch CSRF for endpoint=/DeployScriptCollectionDesigntimeArtifact params={"Id":"'ITGWEPOSSAPINTEGRATION3_Scripts'","Version":"'active'"}`
- `Fetching CSRF token: GET https://.../api/v1/DeployScriptCollectionDesigntimeArtifact params={"Id":"'ITGWEPOSSAPINTEGRATION3_Scripts'","Version":"'active'"}`
- `Failed to fetch CSRF token for script collection deploy ITGWEPOSSAPINTEGRATION3_Scripts via /DeployScriptCollectionDesigntimeArtifact (Version=active)`

Notes:
- `Id` and `Version` params present in preflight -> missing-params hypothesis unlikely for this run.
- Leading slash on endpoint changed path form, but full URL resolves to `.../api/v1/DeployScriptCollectionDesigntimeArtifact` so slash not root cause.
- Failure comes from `fetchCsrfToken` not finding `x-csrf-token` header on response; code location:
	- caller: `src/api/scriptCollections.ts` call to `client.fetchCsrfToken` ([src/api/scriptCollections.ts](src/api/scriptCollections.ts#L107-L126)).
	- helper: `src/api/client.ts` reads `response.headers['x-csrf-token']` and throws when missing ([src/api/client.ts](src/api/client.ts#L61-L74)).

Likely causes (ordered):
- Auth/authorization problem -> server returns 401/403 page/json without `x-csrf-token`.
- Server returns error (4xx/5xx) for function-import invocation even though params present -> no token header.
- Endpoint needs different invocation shape (namespace, service-root, or POST) so GET preflight hits wrong handler.
- Server requires prior session cookie or different Accept header so token not returned.

Next steps to narrow root cause (run locally and capture logs):
1. Re-run deploy (we added request/response header logs). Capture full logs including `CSRF fetch response headers: ...` line.
2. If response status != 200, capture body. If 401/403, check `getAccessToken()` and `btpBaseUrl`.
3. Try curl to reproduce preflight and show headers:

```bash
curl -i -H "Authorization: Bearer <token>" -H "X-CSRF-Token: Fetch" "https://<host>/api/v1/DeployScriptCollectionDesigntimeArtifact?Id='ITGWEPOSSAPINTEGRATION3_Scripts'&Version='active'"
```

4. If curl returns `x-csrf-token`, compare headers with axios run; if curl returns none, server not providing token -> escalate to BTP/service team.

If you paste the `CSRF fetch response headers: ...` entry from your next run, I will update this report with concrete server response and exact fix.

## Resolution

Confirmed root cause:
- SAP BTP returned `405 Method Not Allowed` for CSRF preflight.
- Response still included `x-csrf-token` and `set-cookie` headers.
- `fetchCsrfToken` treated any non-2xx Axios response as fatal, so it threw before deploy POST.

Fix applied:
- `src/api/client.ts` now accepts `x-csrf-token` from error responses and reuses it when present.
- The deploy path no longer fails on token-bearing `405` responses.

Verification:
- `npm run deploy -- --id ITGWEPOSSAPINTEGRATION3_Scripts` completed successfully.
- Deploy POST returned `202`.

Key log line:
- `CSRF fetch returned status=405 but included token; using it for DeployScriptCollectionDesigntimeArtifact`
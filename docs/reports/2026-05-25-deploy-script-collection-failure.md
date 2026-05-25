# Deploy Failure Report

## Symptom
`npm run deploy -- --id ITGWEPOSSAPINTEGRATION3_Scripts` exits with:

`Failed to deploy script collection ITGWEPOSSAPINTEGRATION3_Scripts`

## Root Cause
Baseline deploy code in HEAD used a correct endpoint string, but CSRF preflight did not send function-import query params in [src/api/scriptCollections.ts](src/api/scriptCollections.ts#L113-L131).

The POST needs `Id` and `Version` query params, but the CSRF GET hit bare `DeployScriptCollectionDesigntimeArtifact`.
That makes SAP BTP reject or misroute preflight, so token fetch fails before deploy POST runs.

Current working tree sends the same params on CSRF fetch and POST, and separates CSRF fetch from deploy POST for clearer errors.

## Evidence
- `git diff -- src/api/scriptCollections.ts` shows HEAD already used `DeployScriptCollectionDesigntimeArtifact`; the current worktree now also sends `Id` and `Version` into CSRF preflight.
- [src/commands/deploy.ts](src/commands/deploy.ts#L17-L22) always calls this API first, so deploy stops at script collection deploy.
- The old implementation wrapped CSRF fetch and deploy POST in one try/catch, so the user saw only a generic deploy failure.

## Impact
All script collection deploys fail for any collection id on the baseline revision, including `ITGWEPOSSAPINTEGRATION3_Scripts`.

## Recommendation
Keep `DeployScriptCollectionDesigntimeArtifact` in [src/api/scriptCollections.ts](src/api/scriptCollections.ts), pass function-import params into CSRF preflight, and keep focused tests on exact endpoint and error text.

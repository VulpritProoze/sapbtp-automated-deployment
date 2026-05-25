# Getting started

## Prerequisites
- Node.js 18 or newer
- Network access to SAP BTP Integration Suite

## Setup
1. Install dependencies:
   - npm install
2. Create a .env file:
   - Copy .env.example to .env and fill in OAUTH_TOKEN_URL, CLIENT_ID, CLIENT_SECRET
3. Create configuration file in project root:
   - Preferred: `sapbtp.config.json`
   - Fallback (migration): `iflow.config.json`
   - Include at minimum `btpBaseUrl` and `collections`. `scriptCollectionsDir` is optional and defaults to `ScriptCollections`.
4. Create initial folders if needed:
   - npm run init -- --id <collectionId> --name <displayName>

## First run
- npm run status

## Folder layout
- Default: `ScriptCollections/<collectionId>` contains flat .groovy files only.
- Override folder name via `scriptCollectionsDir` in `sapbtp.config.json` or `iflow.config.json`.

## Install (optional)
- To install CLI globally after publishing: `npm install -g iflow-cli` then run `iflow-cli status`.

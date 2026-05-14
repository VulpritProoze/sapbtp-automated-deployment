# Getting started

## Prerequisites
- Node.js 18 or newer
- Network access to SAP BTP Integration Suite

## Setup
1. Install dependencies:
   - npm install
2. Create a .env file:
   - Copy .env.example to .env and fill in OAUTH_TOKEN_URL, CLIENT_ID, CLIENT_SECRET
3. Configure iflow.config.json with your btpBaseUrl and collections.
4. Create initial folders if needed:
   - npm run init -- --id <collectionId> --name <displayName>

## First run
- npm run status

## Folder layout
ScriptCollections/<collectionId> contains flat .groovy files only.

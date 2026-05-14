# Commands

## pull
Download a script collection ZIP and extract .groovy files.
- npm run pull -- --id <collectionId>

## push
Upload local .groovy files as a ZIP to SAP BTP.
- npm run push -- --id <collectionId>
- npm run push -- --id <collectionId> --deploy

## deploy
Deploy a script collection. Use --iflow to deploy the associated iFlow.
- npm run deploy -- --id <collectionId>
- npm run deploy -- --id <collectionId> --iflow

## diff
Compare local .groovy files against the remote version. Exits with code 1 on differences.
- npm run diff -- --id <collectionId>

## status
Show collection status across all configured collections.
- npm run status

## init
Create a new local collection folder and append config.
- npm run init -- --id <collectionId> --name <displayName>

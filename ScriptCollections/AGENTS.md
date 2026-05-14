# ScriptCollections rules

- This folder contains flat .groovy files only, one subfolder per SAP BTP script collection.
- Subfolder names must exactly match the Id field in iflow.config.json.
- Never create subdirectories inside a collection folder.
- Never rename .groovy files manually; use npm run pull to sync from remote.
- Never edit these files via the agent directly in production; always go through the CLI commands.

# npm Package Implementation Plan

## Objective
Turn the current iflow-cli codebase into a clean npm package that:
- installs as a usable CLI
- exposes the current commands for programmatic use
- keeps working against the consumer's own project root
- discovers configuration files automatically
- allows only one user-facing customization for now: the ScriptCollections folder name

## Desired end state
After installation, a consumer should be able to:
- run the commands from the terminal without copying source files
- import supported helpers from the package if they want to integrate the CLI into their own tooling
- keep local script collections in a folder named ScriptCollections by default
- override that folder name through package config when needed
- store sensitive values in .env in the consumer project root
- keep the main operational config in sapbtp.config.json, with iflow.config.json supported as a migration fallback

## Explicit non-goals
This package should not:
- copy files into the consumer's codebase during installation
- mutate the consumer project outside normal command behavior
- publish repository-only folders such as .claude, .agents, .bob, .github, docs, coverage, or instruction files
- expose additional customization for ScriptCollections behavior beyond the folder name at this stage
- change the SAP BTP API behavior unless required by config discovery or packaging

## Packaging strategy
Use a standard npm package layout with two public surfaces:
1. CLI surface
   - expose the executable through bin
   - keep the command names and flags stable
2. Library surface
   - add an index entrypoint that re-exports the supported runtime helpers
   - keep the exported API small and intentional

Recommended package metadata:
- main points to the compiled runtime entrypoint
- types points to generated declarations
- bin maps the command name to the compiled CLI entrypoint
- exports defines the supported import paths
- files limits publish output to dist and required metadata

## Publish scope
Publish only runtime-relevant artifacts.

Include:
- compiled output under dist
- package.json
- README.md
- LICENSE if present

Exclude:
- src tests
- docs
- coverage
- .claude and .agents content
- .github automation files
- local instruction documents
- any debug or scratch directories

This keeps the npm package lean and avoids shipping workspace-specific material.

## Configuration model
Keep configuration centered around a user project root rather than the package install location.

Primary config file:
- sapbtp.config.json

Compatibility fallback:
- iflow.config.json

Discovery order:
1. resolve the active project root from the current working directory
2. look for sapbtp.config.json in that root
3. if not found, fall back to iflow.config.json
4. load .env from the same resolved root

ScriptCollections customization:
- default folder name remains ScriptCollections
- allow a single optional config value to override the folder name
- resolve the folder relative to the project root, not relative to the installed package

Recommended config shape:
{
  "btpBaseUrl": "https://.../api/v1",
  "scriptCollectionsDir": "ScriptCollections",
  "collections": [...],
  "defaultVersion": "active"
}

If the user changes the folder name, only scriptCollectionsDir changes.

## Implementation phases

### Phase 1: package boundary
Goal: make the repository publishable as a package without changing runtime behavior.

Tasks:
- create a public src/index.ts entrypoint
- re-export the supported command runners and config types
- add a CLI entrypoint that remains runnable from npm bin
- update package metadata for bin, main, types, exports, and files
- add a build step that produces dist output suitable for publishing

Exit criteria:
- npm install exposes the CLI executable
- library consumers can import the package entrypoint
- the package publish list excludes source-only repo material

### Phase 2: config discovery
Goal: make the package discover consumer configuration reliably.

Tasks:
- refactor config loading to resolve the consumer project root from cwd
- support sapbtp.config.json first, then iflow.config.json as fallback
- load .env from the same discovered root
- keep all existing required env checks and config validation
- preserve current config errors with clearer file-path reporting

Exit criteria:
- running commands from the consumer project root still works
- package install location does not affect config lookup
- both config filenames are supported during migration

### Phase 3: folder customization
Goal: support one configurable local collections folder.

Tasks:
- keep the default folder name ScriptCollections
- allow an override in config for the folder name only
- ensure pull, push, diff, init, and status all use the resolved folder consistently
- make sure folder resolution is based on the consumer root and not the package root

Exit criteria:
- default behavior is unchanged for existing users
- a user can rename the folder once in config and all commands follow it

### Phase 4: library API cleanup
Goal: expose a stable import surface for other codebases.

Tasks:
- define what is safe to export publicly
- avoid exporting internal helpers that would freeze implementation details
- keep command orchestration in src/commands and export only the intended public wrappers

Exit criteria:
- imports are predictable and documented
- internal refactors do not break consumers unnecessarily

### Phase 5: documentation and migration
Goal: make the change easy to adopt.

Tasks:
- update docs/getting-started.md for package install and config discovery
- update docs/config-reference.md for sapbtp.config.json and scriptCollectionsDir behavior
- add a new plan or release note describing the migration from iflow.config.json
- document which repo files are published and which are intentionally excluded

Exit criteria:
- a new user can install the package and configure it without reading source code
- existing users understand the fallback path and config rename

### Phase 6: verification
Goal: prove the package behaves like a consumable npm artifact.

Tasks:
- run typecheck after the packaging refactor
- run the existing Vitest suite
- add focused tests for config discovery, fallback order, and folder override
- verify the generated publish set with npm pack or an equivalent dry run

Exit criteria:
- packaging changes do not break current commands
- the publish artifact contains only expected runtime files
- config discovery tests cover both config filenames and .env resolution

## Suggested code changes by area

### src/cli.ts
- keep commander registration here
- ensure the compiled CLI remains the package executable
- keep command definitions thin and orchestration focused

### src/index.ts
- add the public import surface
- re-export only intentional runtime helpers

### src/config/loader.ts
- introduce config discovery logic
- support sapbtp.config.json and iflow.config.json
- resolve .env and scriptCollectionsDir from the discovered project root

### src/commands
- keep command files as orchestrators only
- remove any assumptions that depend on the package install path

### package.json
- add bin, exports, files, and package build metadata
- add scripts for build and pack verification

### docs
- update command, config, and getting-started docs
- add a migration note for the new config name

## Acceptance criteria
The work is complete when all of the following are true:
- installing the package exposes the commands automatically
- commands operate on the consumer's project root
- sapbtp.config.json is discovered automatically
- iflow.config.json remains supported as a fallback
- .env is discovered from the same project root
- ScriptCollections remains the default folder name
- a user can override only the ScriptCollections folder name
- only runtime-relevant files are published to npm

## Recommended order of execution
1. add package metadata and public entrypoints
2. implement config discovery and fallback support
3. add folder-name customization
4. update docs
5. add or update tests
6. verify the publish artifact

## Open design decisions to keep explicit
- Whether the package name should remain iflow-cli or be renamed for the new npm package identity
- Whether to keep iflow.config.json as a long-term alias or eventually deprecate it
- Whether the public library surface should export command runners directly or a smaller facade API
- Whether release automation should publish from main only or from tagged releases only

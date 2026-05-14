---
name: unit-test-check
description: Checks unit test coverage for iflow-cli source files, identifies untested commands and API functions, and scaffolds missing Vitest test files. Invoke with /unit-test-check on a file or the whole src/ directory.
---

You validate unit test coverage and scaffold missing tests for iflow-cli.

## Test runner context
- Framework: Vitest with @vitest/coverage-v8.
- Test files live in src/__tests__/ mirroring the src/ structure.
- Test file naming: <module>.test.ts (example: src/__tests__/commands/push.test.ts).
- Mock SAP BTP HTTP calls using vi.mock on src/api/client.ts; never make real network calls in tests.
- Mock filesystem using vi.mock('fs') or memfs; never touch real files in tests.

## What you must do when invoked
1. Run npx vitest run --coverage and parse the coverage report.
2. For each file in src/, check whether a corresponding test file exists in src/__tests__/.
3. Report a coverage table:
   File                          | Stmts | Branch | Funcs | Lines | Status
   ------------------------------|-------|--------|-------|-------|-------
   src/commands/push.ts          |  82%  |  75%   |  100% |  82%  | ⚠️
   src/api/scriptCollections.ts  |  0%   |  0%    |  0%   |  0%   | ❌ no tests
   src/auth/oauth.ts             |  95%  |  90%   |  100% |  95%  | ✅
4. For any file with 0% coverage or no test file, scaffold a test file with:
   - Correct imports.
   - vi.mock stubs for all external dependencies (axios client, fs, config loader).
   - One describe block per exported function.
   - One passing placeholder test per describe (use it.todo for unimplemented cases).
   - Comments marking where assertions need to be filled in.

## Priority order for scaffolding
1. src/commands/push.ts
2. src/commands/pull.ts
3. src/commands/deploy.ts
4. src/api/scriptCollections.ts
5. src/auth/oauth.ts
6. src/zip/handler.ts
7. src/config/loader.ts
8. Everything else

## Minimum coverage thresholds (gate)
- Statements: 70%
- Branches: 60%
- Functions: 80%
- Lines: 70%

If any file falls below threshold, report a gate failure and do not declare the check passed.

## Scaffold template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { <exportedFunction> } from '../../<module>'

// Mock all external dependencies -- never make real network or filesystem calls
vi.mock('../../api/client', () => ({
  createApiClient: vi.fn(() => ({
    axios: {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
    },
    fetchCsrfToken: vi.fn(),
  })),
}))

vi.mock('../../config/loader', () => ({
  loadConfig: vi.fn(() => ({
    btpBaseUrl: 'https://mock.example.com/api/v1',
    scriptCollectionsDir: './ScriptCollections',
    collections: [{ id: 'Scripts_Test', name: 'Scripts_Test', iflowId: 'TestFlow', iflowVersion: 'active' }],
    defaultVersion: 'active',
  })),
}))

vi.mock('fs', () => ({
  default: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      rm: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
    },
    constants: { F_OK: 0 },
  },
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    rm: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
  },
  constants: { F_OK: 0 },
}))

describe('<module>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('<exportedFunction>', () => {
    it('placeholder', () => {
      expect(true).toBe(true)
    })
    it.todo('should <happy path description>')
    it.todo('should throw IFlowError when SAP BTP returns 4xx')
    it.todo('should throw IFlowError when network is unreachable')
  })
})
```

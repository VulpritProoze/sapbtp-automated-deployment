import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("commander", () => {
  const chain = {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    showHelpAfterError: vi.fn().mockReturnThis(),
    command: vi.fn().mockReturnThis(),
    requiredOption: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parseAsync: vi.fn().mockResolvedValue(undefined),
  };

  return {
    Command: vi.fn(() => chain),
  };
});

vi.mock("../api/client", () => ({
  createApiClient: vi.fn(() => ({
    axios: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    },
    fetchCsrfToken: vi.fn(),
  })),
}));

vi.mock("../config/loader", () => ({
  loadConfig: vi.fn(() => ({
    btpBaseUrl: "https://mock.example.com/api/v1",
    scriptCollectionsDir: "./ScriptCollections",
    collections: [],
    defaultVersion: "active",
  })),
}));

vi.mock("../commands/deploy", () => ({
  runDeployCommand: vi.fn(),
}));

vi.mock("../commands/diff", () => ({
  runDiffCommand: vi.fn(),
}));

vi.mock("../commands/init", () => ({
  runInitCommand: vi.fn(),
}));

vi.mock("../commands/pull", () => ({
  runPullCommand: vi.fn(),
}));

vi.mock("../commands/push", () => ({
  runPushCommand: vi.fn(),
}));

vi.mock("../commands/status", () => ({
  runStatusCommand: vi.fn(),
}));

vi.mock("../utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("cli", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("placeholder", async () => {
    // TODO: assert CLI command registration and bootstrap behavior.
    expect(true).toBe(true);
  });

  it.todo("should register all CLI commands");
});
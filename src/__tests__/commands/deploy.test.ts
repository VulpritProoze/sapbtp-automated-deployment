import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDeployCommand } from "../../commands/deploy";

vi.mock("../../api/client", () => ({
  createApiClient: vi.fn(() => ({
    axios: {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
    },
    fetchCsrfToken: vi.fn(),
  })),
}));

vi.mock("../../config/loader", () => ({
  loadConfig: vi.fn(() => ({
    btpBaseUrl: "https://mock.example.com/api/v1",
    scriptCollectionsDir: "./ScriptCollections",
    collections: [
      {
        id: "Scripts_Test",
        name: "Scripts_Test",
        iflowId: "TestFlow",
        iflowVersion: "active",
      },
    ],
    defaultVersion: "active",
  })),
}));

vi.mock("fs", () => ({
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
}));

describe("commands/deploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runDeployCommand", () => {
    it("placeholder", () => {
      // TODO: assert deploy endpoint calls and iflow behavior.
      expect(runDeployCommand).toBeDefined();
    });

    it.todo("should deploy the script collection");
    it.todo("should deploy the iFlow when --iflow is set");
    it.todo("should surface IFlowError on API failure");
  });
});

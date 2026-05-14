import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPullCommand } from "../../commands/pull";

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

describe("commands/pull", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runPullCommand", () => {
    it("placeholder", () => {
      // TODO: assert ZIP extraction and file writes.
      expect(runPullCommand).toBeDefined();
    });

    it.todo("should download and extract the remote zip");
    it.todo("should overwrite local .groovy files");
    it.todo("should surface IFlowError on API failure");
  });
});

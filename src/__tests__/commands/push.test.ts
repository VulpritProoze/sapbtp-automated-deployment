import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPushCommand } from "../../commands/push";

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

describe("commands/push", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runPushCommand", () => {
    it("placeholder", () => {
      // TODO: assert API call wiring and payload encoding.
      expect(runPushCommand).toBeDefined();
    });

    it.todo("should upload the collection zip");
    it.todo("should deploy when --deploy is set");
    it.todo("should surface IFlowError on API failure");
  });
});

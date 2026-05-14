import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccessToken } from "../../auth/oauth";

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

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(() => false),
  },
  isAxiosError: vi.fn(() => false),
}));

describe("auth/oauth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccessToken", () => {
    it("placeholder", () => {
      // TODO: assert token caching and expiry behavior.
      expect(getAccessToken).toBeDefined();
    });

    it.todo("should fetch a token when cache is empty");
    it.todo("should reuse cached token until expiry");
    it.todo("should throw IFlowError on auth failure");
  });
});

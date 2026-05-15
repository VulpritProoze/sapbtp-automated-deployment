import { describe, it, expect, vi, beforeEach } from "vitest";
import { encodeBase64Url, zipGroovyFiles, extractGroovyZip } from "../../zip/handler";

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

describe("zip/handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("encodeBase64Url", () => {
    it("encodes base64url without padding", () => {
      expect(encodeBase64Url(Buffer.from("f"))).toBe("Zg");
    });

    it.todo("should replace +/ and trim padding");
  });

  describe("zipGroovyFiles", () => {
    it("placeholder", () => {
      // TODO: assert zip contains flat .groovy entries.
      expect(zipGroovyFiles).toBeDefined();
    });

    it.todo("should throw when no .groovy files exist");
  });

  describe("extractGroovyZip", () => {
    it("placeholder", () => {
      // TODO: assert extraction writes .groovy files to dest.
      expect(extractGroovyZip).toBeDefined();
    });

    it.todo("should ignore non-groovy files");
  });
});

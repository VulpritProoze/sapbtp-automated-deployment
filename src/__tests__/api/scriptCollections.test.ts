import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getScriptCollectionMetadata,
  downloadScriptCollectionZip,
  uploadScriptCollectionZip,
  deployScriptCollection,
  saveScriptCollectionAsVersion,
} from "../../api/scriptCollections";

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

describe("api/scriptCollections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getScriptCollectionMetadata", () => {
    it("placeholder", () => {
      // TODO: assert metadata response parsing.
      expect(getScriptCollectionMetadata).toBeDefined();
    });

    it.todo("should return metadata for a collection");
    it.todo("should throw IFlowError on 4xx response");
  });

  describe("downloadScriptCollectionZip", () => {
    it("placeholder", () => {
      // TODO: assert zip buffer conversion.
      expect(downloadScriptCollectionZip).toBeDefined();
    });

    it.todo("should download the collection zip");
    it.todo("should throw IFlowError on network failure");
  });

  describe("uploadScriptCollectionZip", () => {
    it("placeholder", () => {
      // TODO: assert request body payload and CSRF usage.
      expect(uploadScriptCollectionZip).toBeDefined();
    });

    it.todo("should upload ZIP payload with base64url content");
    it.todo("should throw IFlowError when upload fails");
  });

  describe("deployScriptCollection", () => {
    it("placeholder", () => {
      // TODO: assert deploy endpoint call.
      expect(deployScriptCollection).toBeDefined();
    });

    it.todo("should deploy the script collection");
    it.todo("should throw IFlowError on CSRF failure");
  });

  describe("saveScriptCollectionAsVersion", () => {
    it("placeholder", () => {
      // TODO: assert save-as-version request parameters.
      expect(saveScriptCollectionAsVersion).toBeDefined();
    });

    it.todo("should save the collection as a new version");
    it.todo("should throw IFlowError on API failure");
  });
});

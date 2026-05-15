import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPushCommand } from "../../commands/push";
import {
  deployScriptCollection,
  uploadScriptCollectionZip,
  downloadScriptCollectionZip,
} from "../../api/scriptCollections";
import { zipGroovyFiles } from "../../zip/handler";
import { logger } from "../../utils/logger";
import { ApiClient } from "../../api/client";

vi.mock("../../api/client", () => ({
  createApiClient: vi.fn(() => ({
    axios: {},
    fetchCsrfToken: vi.fn(),
  })),
}));

vi.mock("../../api/scriptCollections", () => ({
  deployScriptCollection: vi.fn(),
  uploadScriptCollectionZip: vi.fn(),
  saveScriptCollectionAsVersion: vi.fn(),
  downloadScriptCollectionZip: vi.fn(),
}));

vi.mock("../../zip/handler", () => ({
  zipGroovyFiles: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../config/loader", () => ({
  loadConfig: vi.fn(() => ({
    btpBaseUrl: "https://mock",
    scriptCollectionsDir: "./ScriptCollections",
    collections: [],
    defaultVersion: "active",
  })),
  findCollection: vi.fn(() => ({ name: "MockName" })),
}));

describe("commands/push", () => {
  const mockClient = {} as unknown as ApiClient;
  const mockConfig = {
    scriptCollectionsDir: "dir",
    defaultVersion: "active",
    btpBaseUrl: "",
    collections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
  });

  describe("runPushCommand", () => {
    it("should download base zip and merge groovy files", async () => {
      const mockBaseZip = Buffer.from("base");
      const mockMergedZip = Buffer.from("merged");

      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(mockBaseZip);
      vi.mocked(zipGroovyFiles).mockResolvedValueOnce(mockMergedZip);

      await runPushCommand(mockClient, mockConfig, { id: "Test1" });

      expect(downloadScriptCollectionZip).toHaveBeenCalledWith(mockClient, "Test1", "active");
      expect(zipGroovyFiles).toHaveBeenCalledWith(expect.any(String), mockBaseZip);
      expect(uploadScriptCollectionZip).toHaveBeenCalledWith(mockClient, {
        id: "Test1",
        version: "active",
        name: "MockName",
        zipBuffer: mockMergedZip,
      });
    });

    it("should handle base zip download failure and continue", async () => {
      const mockMergedZip = Buffer.from("merged");

      vi.mocked(downloadScriptCollectionZip).mockRejectedValueOnce(new Error("Not found"));
      vi.mocked(zipGroovyFiles).mockResolvedValueOnce(mockMergedZip);

      await runPushCommand(mockClient, mockConfig, { id: "Test2" });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Could not download base ZIP")
      );
      expect(zipGroovyFiles).toHaveBeenCalledWith(expect.any(String), undefined);
      expect(uploadScriptCollectionZip).toHaveBeenCalled();
    });

    it("should deploy when --deploy is set", async () => {
      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(Buffer.from(""));
      vi.mocked(zipGroovyFiles).mockResolvedValueOnce(Buffer.from(""));

      await runPushCommand(mockClient, mockConfig, { id: "Test3", deploy: true });

      expect(deployScriptCollection).toHaveBeenCalledWith(mockClient, "Test3", "active");
    });

    it("should exit 1 on API failure", async () => {
      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(Buffer.from(""));
      vi.mocked(zipGroovyFiles).mockRejectedValueOnce(new Error("Zip error"));

      await expect(
        runPushCommand(mockClient, mockConfig, { id: "Test4" })
      ).rejects.toThrow("process.exit");

      expect(logger.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});

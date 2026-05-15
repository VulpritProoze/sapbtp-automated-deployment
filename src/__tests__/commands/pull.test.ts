import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPullCommand } from "../../commands/pull";
import { downloadScriptCollectionZip } from "../../api/scriptCollections";
import { extractGroovyZip } from "../../zip/handler";
import { logger } from "../../utils/logger";
import { ApiClient } from "../../api/client";

vi.mock("../../api/scriptCollections", () => ({
  downloadScriptCollectionZip: vi.fn(),
}));

vi.mock("../../zip/handler", () => ({
  extractGroovyZip: vi.fn(),
}));

vi.mock("../../utils/fs", () => ({
  ensureDir: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("commands/pull", () => {
  const mockClient = {} as unknown as ApiClient;
  const mockConfig = { scriptCollectionsDir: "./ScriptCollections", defaultVersion: "active", btpBaseUrl: "", collections: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
  });

  describe("runPullCommand", () => {
    it("should download zip and extract groovy files", async () => {
      const mockZipBuffer = Buffer.from("mock zip");
      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(mockZipBuffer);
      vi.mocked(extractGroovyZip).mockResolvedValueOnce(["file1.groovy", "file2.groovy"]);

      await runPullCommand(mockClient, mockConfig, { id: "test-id" });

      expect(downloadScriptCollectionZip).toHaveBeenCalledWith(mockClient, "test-id", "active");
      expect(extractGroovyZip).toHaveBeenCalledWith(mockZipBuffer, expect.any(String));
      expect(logger.success).toHaveBeenCalledTimes(2);
    });

    it("should warn if no groovy files are found", async () => {
      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(Buffer.from(""));
      vi.mocked(extractGroovyZip).mockResolvedValueOnce([]);

      await runPullCommand(mockClient, mockConfig, { id: "test-id" });

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("No .groovy files found"));
    });

    it("should exit with 1 on error", async () => {
      vi.mocked(downloadScriptCollectionZip).mockRejectedValueOnce(new Error("API Error"));

      await expect(runPullCommand(mockClient, mockConfig, { id: "test-id" })).rejects.toThrow("process.exit");

      expect(logger.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});

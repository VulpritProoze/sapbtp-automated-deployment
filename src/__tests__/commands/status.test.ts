import { describe, it, expect, vi, beforeEach } from "vitest";
import { runStatusCommand } from "../../commands/status";
import { getScriptCollectionMetadata } from "../../api/scriptCollections";
import { logger } from "../../utils/logger";
import { ApiClient } from "../../api/client";
import * as fsUtils from "../../utils/fs";

vi.mock("../../api/scriptCollections", () => ({
  getScriptCollectionMetadata: vi.fn(),
}));

vi.mock("../../utils/fs", () => ({
  listGroovyFiles: vi.fn(),
  getLatestMtime: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("commands/status", () => {
  const mockClient = {} as unknown as ApiClient;
  const mockConfig = {
    scriptCollectionsDir: "./ScriptCollections",
    defaultVersion: "active",
    collections: [
      { id: "test-id", name: "Test Collection", iflowVersion: "1.0.0" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runStatusCommand", () => {
    it("should print status table for configured collections", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const mockMetadata = { Id: "test-id", Name: "Test", Version: "1.0.0", ModifiedAt: new Date().toISOString() };
      
      vi.mocked(getScriptCollectionMetadata).mockResolvedValueOnce(mockMetadata);
      vi.mocked(fsUtils.listGroovyFiles).mockResolvedValueOnce(["file1.groovy"]);
      vi.mocked(fsUtils.getLatestMtime).mockResolvedValueOnce(Date.now());

      await runStatusCommand(mockClient, mockConfig as any);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Test Collection"));
      consoleSpy.mockRestore();
    });

    it("should handle metadata fetch failure and show unknown status", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.mocked(getScriptCollectionMetadata).mockRejectedValueOnce(new Error("API Error"));
      vi.mocked(fsUtils.listGroovyFiles).mockResolvedValueOnce([]);
      vi.mocked(fsUtils.getLatestMtime).mockResolvedValueOnce(null);

      await runStatusCommand(mockClient, mockConfig as any);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("?"));
      consoleSpy.mockRestore();
    });

    it("should exit with 1 on unexpected error", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
      const badConfig = { ...mockConfig, collections: [{ id: "bad" }] };
      vi.mocked(getScriptCollectionMetadata).mockImplementationOnce(() => {
        throw new Error("Critical Failure");
      });

      await runStatusCommand(mockClient, badConfig as any);

      expect(logger.error).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });
});

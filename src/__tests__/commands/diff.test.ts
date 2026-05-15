import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { runDiffCommand } from "../../commands/diff";
import { downloadScriptCollectionZip } from "../../api/scriptCollections";
import { logger } from "../../utils/logger";
import { ApiClient } from "../../api/client";
import * as fsUtils from "../../utils/fs";

vi.mock("fs", () => ({
  default: {
    promises: {
      mkdtemp: vi.fn(() => Promise.resolve("/tmp/iflow-diff-abc")),
      rm: vi.fn(),
    },
  },
}));

vi.mock("../../api/scriptCollections", () => ({
  downloadScriptCollectionZip: vi.fn(),
}));

vi.mock("../../zip/handler", () => ({
  extractGroovyZip: vi.fn(),
}));

vi.mock("../../utils/fs", () => ({
  listGroovyFiles: vi.fn(),
  readFileText: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("commands/diff", () => {
  const mockClient = {} as unknown as ApiClient;
  const mockConfig = {
    scriptCollectionsDir: "./ScriptCollections",
    defaultVersion: "active",
    btpBaseUrl: "",
    collections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = 0;
  });

  describe("runDiffCommand", () => {
    it("should report no differences if local and remote match", async () => {
      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(Buffer.from(""));
      vi.mocked(fsUtils.listGroovyFiles).mockResolvedValueOnce(["local/file1.groovy"]);
      vi.mocked(fsUtils.listGroovyFiles).mockResolvedValueOnce(["remote/file1.groovy"]);
      vi.mocked(fsUtils.readFileText).mockResolvedValue("same content");

      await runDiffCommand(mockClient, mockConfig, { id: "test-id" });

      expect(logger.success).toHaveBeenCalledWith(expect.stringContaining("No differences found"));
      expect(process.exitCode).toBe(0);
    });

    it("should set exit code 1 if differences are found", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.mocked(downloadScriptCollectionZip).mockResolvedValueOnce(Buffer.from(""));
      vi.mocked(fsUtils.listGroovyFiles).mockResolvedValueOnce(["local/file1.groovy"]);
      vi.mocked(fsUtils.listGroovyFiles).mockResolvedValueOnce(["remote/file1.groovy"]);
      
      vi.mocked(fsUtils.readFileText)
        .mockResolvedValueOnce("local content")
        .mockResolvedValueOnce("remote content");

      await runDiffCommand(mockClient, mockConfig, { id: "test-id" });

      expect(consoleSpy).toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
      consoleSpy.mockRestore();
    });

    it("should exit with 1 on API failure", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
      vi.mocked(downloadScriptCollectionZip).mockRejectedValueOnce(new Error("API Error"));

      await runDiffCommand(mockClient, mockConfig, { id: "test-id" });

      expect(logger.error).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });
});

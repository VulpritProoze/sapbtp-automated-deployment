import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { runInitCommand } from "../../commands/init";
import { logger } from "../../utils/logger";
import * as fsUtils from "../../utils/fs";

vi.mock("fs", () => ({
  default: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
    },
  },
}));

vi.mock("../../utils/fs", () => ({
  ensureDir: vi.fn(),
  fileExists: vi.fn(),
  writeFileText: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("commands/init", () => {
  const mockConfig = {
    scriptCollectionsDir: "./ScriptCollections",
    defaultVersion: "active",
    collections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
  });

  describe("runInitCommand", () => {
    it("should initialize a new collection and update config", async () => {
      vi.mocked(fsUtils.fileExists).mockResolvedValueOnce(false);
      vi.mocked(fs.promises.readFile).mockResolvedValueOnce(JSON.stringify({ collections: [] }));
      vi.mocked(fs.promises.writeFile).mockResolvedValueOnce();

      await runInitCommand(mockConfig as any, { id: "new-col" });

      expect(fsUtils.ensureDir).toHaveBeenCalled();
      expect(fsUtils.writeFileText).toHaveBeenCalledWith(expect.stringContaining("README.md"), expect.any(String));
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalled();
    });

    it("should throw error if collection directory exists", async () => {
      vi.mocked(fsUtils.fileExists).mockResolvedValueOnce(true);
      await runInitCommand(mockConfig as any, { id: "existing" });
      expect(logger.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("should throw error if collection already in config", async () => {
      vi.mocked(fsUtils.fileExists).mockResolvedValueOnce(false);
      vi.mocked(fs.promises.readFile).mockResolvedValueOnce(JSON.stringify({ collections: [{ id: "dup" }] }));
      
      await runInitCommand(mockConfig as any, { id: "dup" });
      
      expect(logger.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});

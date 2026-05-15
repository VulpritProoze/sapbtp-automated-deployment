import { describe, it, expect, vi, beforeEach } from "vitest";
import { runVersionCommand } from "../../commands/version";
import { saveScriptCollectionAsVersion } from "../../api/scriptCollections";
import { logger } from "../../utils/logger";
import { ApiClient } from "../../api/client";

vi.mock("../../api/scriptCollections", () => ({
  saveScriptCollectionAsVersion: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("commands/version", () => {
  const mockClient = {} as unknown as ApiClient;
  const mockConfig = { scriptCollectionsDir: "./ScriptCollections", defaultVersion: "active", btpBaseUrl: "", collections: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
  });

  describe("runVersionCommand", () => {
    it("should save the collection as a new version", async () => {
      vi.mocked(saveScriptCollectionAsVersion).mockResolvedValueOnce();

      await runVersionCommand(mockClient, mockConfig, { id: "test", newVersion: "1.0.1" });

      expect(saveScriptCollectionAsVersion).toHaveBeenCalledWith(mockClient, "test", "1.0.1");
      expect(logger.success).toHaveBeenCalledWith(expect.stringContaining("Saved script collection"));
    });

    it("should exit with 1 on API failure", async () => {
      vi.mocked(saveScriptCollectionAsVersion).mockRejectedValueOnce(new Error("API Error"));

      await expect(
        runVersionCommand(mockClient, mockConfig, { id: "test", newVersion: "1.0.1" })
      ).rejects.toThrow("process.exit");

      expect(logger.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});

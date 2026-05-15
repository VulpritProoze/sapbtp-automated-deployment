import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDeployCommand } from "../../commands/deploy";
import { deployScriptCollection } from "../../api/scriptCollections";
import { deployIflow } from "../../api/iflow";
import { logger } from "../../utils/logger";
import { ApiClient } from "../../api/client";

vi.mock("../../api/scriptCollections", () => ({
  deployScriptCollection: vi.fn(),
}));

vi.mock("../../api/iflow", () => ({
  deployIflow: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("commands/deploy", () => {
  const mockClient = {} as unknown as ApiClient;
  const mockConfig = {
    scriptCollectionsDir: "./ScriptCollections",
    defaultVersion: "active",
    collections: [{ id: "test", name: "T", iflowId: "flow1", iflowVersion: "1.0.0" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
  });

  describe("runDeployCommand", () => {
    it("should deploy script collection", async () => {
      vi.mocked(deployScriptCollection).mockResolvedValueOnce();
      await runDeployCommand(mockClient, mockConfig as any, { id: "test" });
      expect(deployScriptCollection).toHaveBeenCalledWith(mockClient, "test", "active");
      expect(logger.success).toHaveBeenCalledWith(expect.stringContaining("Deployed script collection"));
    });

    it("should deploy iflow if requested", async () => {
      vi.mocked(deployScriptCollection).mockResolvedValueOnce();
      vi.mocked(deployIflow).mockResolvedValueOnce();
      await runDeployCommand(mockClient, mockConfig as any, { id: "test", iflow: true });
      expect(deployIflow).toHaveBeenCalledWith(mockClient, "flow1", "1.0.0");
      expect(logger.success).toHaveBeenCalledTimes(2);
    });

    it("should exit with 1 on error", async () => {
      vi.mocked(deployScriptCollection).mockRejectedValueOnce(new Error("API Error"));
      await runDeployCommand(mockClient, mockConfig as any, { id: "test" });
      expect(logger.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});

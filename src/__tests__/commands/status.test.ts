import { beforeEach, describe, expect, it, vi } from "vitest";
import { runStatusCommand } from "../../commands/status";

vi.mock("../../api/scriptCollections", () => ({
  getScriptCollectionMetadata: vi.fn(),
}));

vi.mock("../../utils/fs", () => ({
  getLatestMtime: vi.fn(),
  listGroovyFiles: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("commands/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runStatusCommand", () => {
    it("placeholder", () => {
      // TODO: assert status table rendering and sync detection.
      expect(runStatusCommand).toBeDefined();
    });

    it.todo("should print a status row for each configured collection");
    it.todo("should exit on unexpected runtime failure");
  });
});
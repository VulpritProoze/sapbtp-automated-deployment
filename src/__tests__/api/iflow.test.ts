import { beforeEach, describe, expect, it, vi } from "vitest";
import { deployIflow } from "../../api/iflow";

vi.mock("../../utils/logger", () => ({
  createIFlowError: vi.fn((code: string, message: string) => {
    const error = new Error(message) as Error & { code: string };
    error.code = code;
    return error;
  }),
}));

describe("api/iflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deployIflow", () => {
    it("placeholder", () => {
      // TODO: assert CSRF token fetch and deploy request payload.
      expect(deployIflow).toBeDefined();
    });

    it.todo("should deploy an iFlow with the requested version");
    it.todo("should throw an API_ERROR when deployment fails");
  });
});

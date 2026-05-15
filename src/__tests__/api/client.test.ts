import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../api/client";

vi.mock("../../auth/oauth", () => ({
  getAccessToken: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  createIFlowError: vi.fn((code: string, message: string) => {
    const error = new Error(message) as Error & { code: string };
    error.code = code;
    return error;
  }),
}));

describe("api/client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createApiClient", () => {
    it("placeholder", () => {
      // TODO: assert request interceptor adds bearer auth and CSRF handling.
      expect(createApiClient).toBeDefined();
    });

    it.todo("should create an ApiClient for a valid base URL");
    it.todo("should throw a CONFIG_ERROR when base URL is missing");
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { createApiClient } from "../../api/client";

vi.mock("axios", () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((err) => err.isAxiosError),
    },
  };
});

vi.mock("../../auth/oauth", () => ({
  getAccessToken: vi.fn(() => Promise.resolve("mock-token")),
}));

describe("api/client", () => {
  const baseUrl = "https://mock.example.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchCsrfToken", () => {
    it("should fetch and cache CSRF token", async () => {
      const { axios: apiAxios, fetchCsrfToken } = createApiClient(baseUrl);
      
      vi.mocked(apiAxios.get).mockResolvedValueOnce({
        headers: {
          "x-csrf-token": "new-token",
          "set-cookie": ["session=123; Path=/"],
        },
      });

      const token1 = await fetchCsrfToken("/any-path");
      const token2 = await fetchCsrfToken("/any-path");

      expect(token1).toBe("new-token");
      expect(token2).toBe("new-token");
      expect(apiAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});

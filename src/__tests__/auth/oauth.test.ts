import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

vi.mock("axios");

describe("auth/oauth", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.OAUTH_TOKEN_URL = "https://auth.example.com/oauth/token";
    process.env.CLIENT_ID = "client-id";
    process.env.CLIENT_SECRET = "client-secret";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getAccessToken", () => {
    it("should fetch a new token if cache is empty", async () => {
      const { getAccessToken } = await import("../../auth/oauth");
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          access_token: "new-token",
          expires_in: 3600,
        },
      });

      const token = await getAccessToken();

      expect(token).toBe("new-token");
      expect(axios.post).toHaveBeenCalledWith(
        "https://auth.example.com/oauth/token",
        expect.stringContaining("grant_type=client_credentials"),
        expect.any(Object)
      );
    });

    it("should use cached token if it has not expired", async () => {
      const { getAccessToken } = await import("../../auth/oauth");
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          access_token: "cached-token",
          expires_in: 3600,
        },
      });

      const token1 = await getAccessToken();
      const token2 = await getAccessToken();

      expect(token1).toBe("cached-token");
      expect(token2).toBe("cached-token");
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});

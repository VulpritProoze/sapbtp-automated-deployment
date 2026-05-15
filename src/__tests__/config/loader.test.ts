import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { loadConfig, findCollection } from "../../config/loader";
import dotenv from "dotenv";

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

describe("config/loader", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OAUTH_TOKEN_URL = "https://auth";
    process.env.CLIENT_ID = "id";
    process.env.CLIENT_SECRET = "secret";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("loadConfig", () => {
    it("should load valid config and env", () => {
      const mockConfig = {
        btpBaseUrl: "https://btp",
        scriptCollectionsDir: "src/collections",
        collections: [
          { id: "c1", name: "C1", iflowId: "i1", iflowVersion: "1.0.0" }
        ],
        defaultVersion: "active"
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig();

      expect(config.btpBaseUrl).toBe("https://btp");
      expect(config.collections).toHaveLength(1);
    });

    it("should throw error if env var is missing", () => {
      delete process.env.CLIENT_ID;
      expect(() => loadConfig()).toThrow("Missing required env var: CLIENT_ID");
    });
  });

  describe("findCollection", () => {
    it("should find collection by id", () => {
      const config = {
        collections: [{ id: "find-me", name: "Name", iflowId: "i", iflowVersion: "v" }]
      } as any;
      const found = findCollection(config, "find-me");
      expect(found).toBeDefined();
      expect(found?.name).toBe("Name");
    });
  });
});

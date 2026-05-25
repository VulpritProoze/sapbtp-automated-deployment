import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getScriptCollectionMetadata,
  downloadScriptCollectionZip,
  uploadScriptCollectionZip,
  deployScriptCollection,
  saveScriptCollectionAsVersion,
} from "../../api/scriptCollections";
import { ApiClient } from "../../api/client";

describe("api/scriptCollections", () => {
  const mockAxios = {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: "https://mock" },
  };
  const mockClient = {
    axios: mockAxios,
    fetchCsrfToken: vi.fn(),
  } as unknown as ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getScriptCollectionMetadata", () => {
    it("should return metadata for a collection", async () => {
      const mockData = { Id: "test", Name: "Test", Version: "1.0.0" };
      mockAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await getScriptCollectionMetadata(mockClient, "test", "1.0.0");

      expect(result).toEqual(mockData);
      expect(mockAxios.get).toHaveBeenCalledWith(
        "/ScriptCollectionDesigntimeArtifacts(Id='test',Version='1.0.0')"
      );
    });

    it("should throw IFlowError on 4xx response", async () => {
      mockAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      });

      await expect(
        getScriptCollectionMetadata(mockClient, "test", "1.0.0")
      ).rejects.toThrow("Failed to fetch metadata");
    });
  });

  describe("downloadScriptCollectionZip", () => {
    it("should download the collection zip", async () => {
      const mockBuffer = Buffer.from("test zip content");
      mockAxios.get.mockResolvedValueOnce({ data: mockBuffer });

      const result = await downloadScriptCollectionZip(mockClient, "test", "1.0.0");

      expect(result).toEqual(mockBuffer);
      expect(mockAxios.get).toHaveBeenCalledWith(
        "/ScriptCollectionDesigntimeArtifacts(Id='test',Version='1.0.0')/$value",
        { responseType: "arraybuffer" }
      );
    });

    it("should throw IFlowError on network failure", async () => {
      mockAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      await expect(
        downloadScriptCollectionZip(mockClient, "test", "1.0.0")
      ).rejects.toThrow("Failed to download script collection");
    });
  });

  describe("uploadScriptCollectionZip", () => {
    it("should upload ZIP payload with base64 content", async () => {
      const mockBuffer = Buffer.from("test zip content");
      vi.mocked(mockClient.fetchCsrfToken).mockResolvedValueOnce("mock-csrf");
      mockAxios.put.mockResolvedValueOnce({ data: {} });

      await uploadScriptCollectionZip(mockClient, {
        id: "test",
        version: "1.0.0",
        name: "Test Name",
        zipBuffer: mockBuffer,
      });

      expect(mockClient.fetchCsrfToken).toHaveBeenCalled();
      expect(mockAxios.put).toHaveBeenCalledWith(
        "/ScriptCollectionDesigntimeArtifacts(Id='test',Version='1.0.0')",
        {
          Name: "Test Name",
          ArtifactContent: mockBuffer.toString("base64"),
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-CSRF-Token": "mock-csrf",
          }),
        })
      );
    });
  });

  describe("deployScriptCollection", () => {
    it("should deploy the script collection", async () => {
      vi.mocked(mockClient.fetchCsrfToken).mockResolvedValueOnce("mock-csrf");
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      await deployScriptCollection(mockClient, "test", "1.0.0");

      expect(mockClient.fetchCsrfToken).toHaveBeenCalledWith(
        "DeployScriptCollectionDesigntimeArtifact",
        { Id: "'test'", Version: "'1.0.0'" }
      );
      expect(mockAxios.post).toHaveBeenCalledWith(
        "DeployScriptCollectionDesigntimeArtifact",
        null,
        expect.objectContaining({
          params: { Id: "'test'", Version: "'1.0.0'" },
        })
      );
    });

    it("should include endpoint context when CSRF fetch fails", async () => {
      vi.mocked(mockClient.fetchCsrfToken).mockRejectedValueOnce(new Error("CSRF Error"));

      await expect(deployScriptCollection(mockClient, "test", "1.0.0")).rejects.toThrow(
        "Failed to fetch CSRF token for script collection deploy test via DeployScriptCollectionDesigntimeArtifact (Version=1.0.0)"
      );
    });

    it("should include endpoint context when deploy request fails", async () => {
      vi.mocked(mockClient.fetchCsrfToken).mockResolvedValueOnce("mock-csrf");
      mockAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { error: { message: { value: "Deploy failed" } } } },
      });

      await expect(deployScriptCollection(mockClient, "test", "1.0.0")).rejects.toThrow(
        "Failed to deploy script collection test via DeployScriptCollectionDesigntimeArtifact (Version=1.0.0)"
      );
    });
  });

  describe("saveScriptCollectionAsVersion", () => {
    it("should save the collection as a new version", async () => {
      vi.mocked(mockClient.fetchCsrfToken).mockResolvedValueOnce("mock-csrf");
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      await saveScriptCollectionAsVersion(mockClient, "test", "1.0.1");

      expect(mockClient.fetchCsrfToken).toHaveBeenCalledWith(
        "ScriptCollectionDesignTimeArtifactSaveAsVersion",
        { Id: "'test'", SaveAsVersion: "'1.0.1'" }
      );
      expect(mockAxios.post).toHaveBeenCalledWith(
        "ScriptCollectionDesignTimeArtifactSaveAsVersion",
        null,
        expect.objectContaining({
          params: { Id: "'test'", SaveAsVersion: "'1.0.1'" },
        })
      );
    });
  });
});

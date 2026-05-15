import { describe, it, expect, vi, beforeEach } from "vitest";
import { deployIflow } from "../../api/iflow";
import { ApiClient } from "../../api/client";

describe("api/iflow", () => {
  const mockAxios = {
    post: vi.fn(),
  };
  const mockClient = {
    axios: mockAxios,
    fetchCsrfToken: vi.fn(),
  } as unknown as ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deployIflow", () => {
    it("should deploy the iFlow", async () => {
      vi.mocked(mockClient.fetchCsrfToken).mockResolvedValueOnce("mock-csrf");
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      await deployIflow(mockClient, "test-iflow", "active");

      expect(mockAxios.post).toHaveBeenCalledWith(
        "DeployIntegrationDesigntimeArtifact",
        null,
        expect.objectContaining({
          params: { Id: "'test-iflow'", Version: "'active'" },
          headers: { "X-CSRF-Token": "mock-csrf" },
        })
      );
    });

    it("should throw IFlowError on failure", async () => {
      vi.mocked(mockClient.fetchCsrfToken).mockRejectedValueOnce(new Error("CSRF Error"));
      await expect(deployIflow(mockClient, "test-iflow", "active")).rejects.toThrow("Failed to deploy iFlow");
    });
  });
});

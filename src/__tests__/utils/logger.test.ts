import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIFlowError, logger } from "../../utils/logger";

describe("utils/logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createIFlowError", () => {
    it("placeholder", () => {
      // TODO: assert error code, status, and cause are preserved.
      expect(createIFlowError).toBeDefined();
    });

    it.todo("should build an IFlowError with code and optional status");
  });

  describe("logger", () => {
    it("placeholder", () => {
      // TODO: assert logger methods format messages with ANSI colors.
      expect(logger).toBeDefined();
    });

    it.todo("should format network errors with the BTP reachability message");
  });
});

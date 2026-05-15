import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIFlowError, logger } from "../../utils/logger";

describe("utils/logger", () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logger", () => {
    it("should print info messages in blue", () => {
      logger.info("test");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("\x1b[34mtest"));
    });

    it("should print success messages in green", () => {
      logger.success("test");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("\x1b[32mtest"));
    });

    it("should format IFlowError with status and correlation ID", () => {
      const err = createIFlowError("CODE", "message", 404, {
        response: {
          headers: { "x-correlationid": "abc-123" },
          data: { error: { message: { value: "Backend error" } } }
        }
      });
      logger.error(err);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("message (HTTP 404) | SAP: Backend error | CorrelationId: abc-123"));
    });

    it("should detect network errors", () => {
      const err = createIFlowError("CODE", "message", undefined, {
        isAxiosError: true,
        response: null
      });
      logger.error(err);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Could not reach SAP BTP"));
    });

    it("should format plain Error objects", () => {
      logger.error(new Error("plain error"));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("plain error"));
    });

    it("should handle arbitrary error values", () => {
      logger.error("string error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("string error"));
    });
  });
});

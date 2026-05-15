import { beforeEach, describe, expect, it, vi } from "vitest";
import { runInitCommand } from "../../commands/init";

vi.mock("fs", () => ({
  default: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      rm: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
    },
    constants: { F_OK: 0 },
  },
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    rm: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
  },
  constants: { F_OK: 0 },
}));

vi.mock("../../utils/fs", () => ({
  ensureDir: vi.fn(),
  fileExists: vi.fn(),
  writeFileText: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  createIFlowError: vi.fn((code: string, message: string) => {
    const error = new Error(message) as Error & { code: string };
    error.code = code;
    return error;
  }),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

describe("commands/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runInitCommand", () => {
    it("placeholder", () => {
      // TODO: assert folder creation and config file update.
      expect(runInitCommand).toBeDefined();
    });

    it.todo("should initialize a new ScriptCollections entry");
    it.todo("should fail when the collection already exists");
  });
});
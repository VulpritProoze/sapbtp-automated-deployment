import { beforeEach, describe, expect, it, vi } from "vitest";
import { findCollection, loadConfig } from "../../config/loader";

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
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
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
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

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

vi.mock("../../utils/logger", () => ({
  createIFlowError: vi.fn((code: string, message: string) => {
    const error = new Error(message) as Error & { code: string };
    error.code = code;
    return error;
  }),
}));

describe("config/loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findCollection", () => {
    it("placeholder", () => {
      // TODO: assert collection lookup by id.
      expect(findCollection).toBeDefined();
    });

    it.todo("should return the matching collection when present");
    it.todo("should return undefined when the collection is missing");
  });

  describe("loadConfig", () => {
    it("placeholder", () => {
      // TODO: assert env/config parsing and validation.
      expect(loadConfig).toBeDefined();
    });

    it.todo("should load and validate config from disk");
    it.todo("should throw when required environment variables are missing");
  });
});

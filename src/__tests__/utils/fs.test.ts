import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureDir,
  fileExists,
  listGroovyFiles,
  readFileText,
  writeFileText,
  getLatestMtime,
} from "../../utils/fs";

vi.mock("fs", () => ({
  default: {
    promises: {
      access: vi.fn(),
      mkdir: vi.fn(),
      readFile: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      writeFile: vi.fn(),
    },
    constants: { F_OK: 0 },
  },
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    writeFile: vi.fn(),
  },
  constants: { F_OK: 0 },
}));

describe("utils/fs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureDir", () => {
    it("placeholder", () => {
      // TODO: assert directory creation uses recursive mkdir.
      expect(ensureDir).toBeDefined();
    });
  });

  describe("fileExists", () => {
    it("placeholder", () => {
      // TODO: assert existence checks map to fs.access.
      expect(fileExists).toBeDefined();
    });
  });

  describe("listGroovyFiles", () => {
    it("placeholder", () => {
      // TODO: assert only .groovy files are returned and sorted.
      expect(listGroovyFiles).toBeDefined();
    });
  });

  describe("readFileText", () => {
    it("placeholder", () => {
      // TODO: assert file contents are read as utf-8.
      expect(readFileText).toBeDefined();
    });
  });

  describe("writeFileText", () => {
    it("placeholder", () => {
      // TODO: assert file contents are written as utf-8.
      expect(writeFileText).toBeDefined();
    });
  });

  describe("getLatestMtime", () => {
    it("placeholder", () => {
      // TODO: assert latest file modification time calculation.
      expect(getLatestMtime).toBeDefined();
    });
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { ensureDir, fileExists, listGroovyFiles, readFileText, writeFileText, getLatestMtime } from "../../utils/fs";

vi.mock("fs", () => ({
  default: {
    promises: {
      mkdir: vi.fn(),
      access: vi.fn(),
      readdir: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      stat: vi.fn(),
    },
    constants: { F_OK: 0 },
  },
}));

describe("utils/fs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ensureDir should call mkdir", async () => {
    await ensureDir("test");
    expect(fs.promises.mkdir).toHaveBeenCalledWith("test", { recursive: true });
  });

  it("fileExists should return true if accessible", async () => {
    vi.mocked(fs.promises.access).mockResolvedValueOnce();
    expect(await fileExists("test")).toBe(true);
  });

  it("fileExists should return false if not accessible", async () => {
    vi.mocked(fs.promises.access).mockRejectedValueOnce(new Error());
    expect(await fileExists("test")).toBe(false);
  });

  it("listGroovyFiles should filter and return paths", async () => {
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: "a.groovy" },
      { isFile: () => true, name: "b.txt" },
      { isFile: () => false, name: "dir.groovy" },
    ] as any);
    const files = await listGroovyFiles("dir");
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("a.groovy");
  });

  it("readFileText and writeFileText should call fs", async () => {
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce("content");
    expect(await readFileText("p")).toBe("content");
    await writeFileText("p", "c");
    expect(fs.promises.writeFile).toHaveBeenCalledWith("p", "c", "utf-8");
  });

  it("getLatestMtime should return max mtime", async () => {
    vi.mocked(fs.promises.stat).mockResolvedValueOnce({ mtimeMs: 100 } as any);
    vi.mocked(fs.promises.stat).mockResolvedValueOnce({ mtimeMs: 200 } as any);
    const time = await getLatestMtime(["a", "b"]);
    expect(time).toBe(200);
  });

  it("getLatestMtime should return null for empty list", async () => {
    expect(await getLatestMtime([])).toBeNull();
  });
});

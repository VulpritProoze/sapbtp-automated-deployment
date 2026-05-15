import { describe, it, expect, vi, beforeEach } from "vitest";
import { zipGroovyFiles, extractGroovyZip } from "../../zip/handler";
import fs from "fs";
import AdmZip from "adm-zip";
import path from "path";

vi.mock("fs", () => ({
  default: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readdir: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
    },
    constants: { F_OK: 0 },
  },
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
  },
  constants: { F_OK: 0 },
}));

describe("zip/handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("zipGroovyFiles", () => {
    it("should throw when no .groovy files exist", async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValueOnce([]);
      
      await expect(zipGroovyFiles("./dir")).rejects.toThrow("No .groovy files found in ./dir");
    });

    it("should create a zip with internal script path", async () => {
      const mockFiles = [
        { isFile: () => true, name: "test1.groovy" },
      ] as fs.Dirent[];
      
      vi.mocked(fs.promises.readdir).mockResolvedValueOnce(mockFiles);
      vi.mocked(fs.promises.readFile).mockResolvedValueOnce(Buffer.from("mock content"));

      const zipBuffer = await zipGroovyFiles("./dir");
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      
      expect(entries).toHaveLength(1);
      expect(entries[0].entryName).toBe("src/main/resources/script/test1.groovy");
      expect(entries[0].getData().toString()).toBe("mock content");
    });

    it("should merge base zip and overwrite scripts", async () => {
      const baseZip = new AdmZip();
      baseZip.addFile("MANIFEST.MF", Buffer.from("manifest"));
      baseZip.addFile("src/main/resources/script/test1.groovy", Buffer.from("old content"));
      const baseBuffer = baseZip.toBuffer();

      const mockFiles = [
        { isFile: () => true, name: "test1.groovy" },
      ] as fs.Dirent[];
      
      vi.mocked(fs.promises.readdir).mockResolvedValueOnce(mockFiles);
      vi.mocked(fs.promises.readFile).mockResolvedValueOnce(Buffer.from("new content"));

      const zipBuffer = await zipGroovyFiles("./dir", baseBuffer);
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      
      expect(entries).toHaveLength(2);
      
      const manifest = entries.find(e => e.entryName === "MANIFEST.MF");
      expect(manifest).toBeDefined();
      expect(manifest?.getData().toString()).toBe("manifest");

      const script = entries.find(e => e.entryName === "src/main/resources/script/test1.groovy");
      expect(script).toBeDefined();
      expect(script?.getData().toString()).toBe("new content");
    });
  });

  describe("extractGroovyZip", () => {
    it("should extract only .groovy files", async () => {
      const zip = new AdmZip();
      zip.addFile("test1.groovy", Buffer.from("content1"));
      zip.addFile("MANIFEST.MF", Buffer.from("manifest"));
      const buffer = zip.toBuffer();

      const dest = "./dest";
      vi.mocked(fs.promises.mkdir).mockResolvedValueOnce(undefined);
      vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined);

      const result = await extractGroovyZip(buffer, dest);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(path.join(dest, "test1.groovy"));
      
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(dest, "test1.groovy"),
        expect.any(Buffer)
      );
    });
  });
});

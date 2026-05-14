import fs from "fs";
import path from "path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function listGroovyFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".groovy"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

export async function readFileText(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf-8");
}

export async function writeFileText(filePath: string, content: string): Promise<void> {
  await fs.promises.writeFile(filePath, content, "utf-8");
}

export async function getLatestMtime(filePaths: string[]): Promise<number | null> {
  if (filePaths.length === 0) {
    return null;
  }

  const stats = await Promise.all(filePaths.map((filePath) => fs.promises.stat(filePath)));
  return Math.max(...stats.map((stat) => stat.mtimeMs));
}

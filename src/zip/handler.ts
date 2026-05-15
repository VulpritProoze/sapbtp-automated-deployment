import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import { createIFlowError } from "../utils/logger";
import { ensureDir, listGroovyFiles } from "../utils/fs";

export async function zipGroovyFiles(collectionDir: string): Promise<Buffer> {
  const files = await listGroovyFiles(collectionDir);
  if (files.length === 0) {
    throw createIFlowError("ZIP_ERROR", `No .groovy files found in ${collectionDir}`);
  }

  const zip = new AdmZip();
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const content = await fs.promises.readFile(filePath);
    zip.addFile(fileName, content);
  }

  return zip.toBuffer();
}

export async function extractGroovyZip(zipBuffer: Buffer, destDir: string): Promise<string[]> {
  await ensureDir(destDir);

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const writtenFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) {
      continue;
    }

    const entryName = entry.entryName;
    if (!entryName.toLowerCase().endsWith(".groovy")) {
      continue;
    }

    const fileName = path.basename(entryName);
    const targetPath = path.join(destDir, fileName);
    await fs.promises.writeFile(targetPath, entry.getData());
    writtenFiles.push(targetPath);
  }

  return writtenFiles;
}

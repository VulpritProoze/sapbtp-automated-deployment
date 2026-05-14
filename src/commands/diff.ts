import fs from "fs";
import os from "os";
import path from "path";
import { ApiClient } from "../api/client";
import { downloadScriptCollectionZip } from "../api/scriptCollections";
import { IFlowConfig } from "../config/loader";
import { extractGroovyZip } from "../zip/handler";
import { listGroovyFiles, readFileText } from "../utils/fs";
import { logger } from "../utils/logger";

export interface DiffOptions {
  id: string;
  version?: string;
}

type DiffLine = { type: "context" | "add" | "remove"; line: string };

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
};

function normalizeLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").split("\n");
}

function buildDiffLines(aLines: string[], bLines: string[]): DiffLine[] {
  const aLen = aLines.length;
  const bLen = bLines.length;
  const table: number[][] = Array.from({ length: aLen + 1 }, () =>
    Array.from({ length: bLen + 1 }, () => 0)
  );

  for (let i = aLen - 1; i >= 0; i -= 1) {
    for (let j = bLen - 1; j >= 0; j -= 1) {
      if (aLines[i] === bLines[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < aLen && j < bLen) {
    if (aLines[i] === bLines[j]) {
      diff.push({ type: "context", line: aLines[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      diff.push({ type: "remove", line: aLines[i] });
      i += 1;
    } else {
      diff.push({ type: "add", line: bLines[j] });
      j += 1;
    }
  }

  while (i < aLen) {
    diff.push({ type: "remove", line: aLines[i] });
    i += 1;
  }

  while (j < bLen) {
    diff.push({ type: "add", line: bLines[j] });
    j += 1;
  }

  return diff;
}

function formatUnifiedDiff(
  fileName: string,
  aLines: string[],
  bLines: string[],
  diffLines: DiffLine[]
): { text: string; hasChanges: boolean } {
  const hasChanges = diffLines.some((line) => line.type !== "context");
  if (!hasChanges) {
    return { text: "", hasChanges: false };
  }

  const header = [
    `--- local/${fileName}`,
    `+++ remote/${fileName}`,
    `@@ -1,${aLines.length} +1,${bLines.length} @@`,
  ];

  const body = diffLines.map((entry) => {
    if (entry.type === "add") {
      return `${colors.green}+${entry.line}${colors.reset}`;
    }
    if (entry.type === "remove") {
      return `${colors.red}-${entry.line}${colors.reset}`;
    }
    return ` ${entry.line}`;
  });

  return {
    text: [...header, ...body].join("\n"),
    hasChanges: true,
  };
}

export async function runDiffCommand(
  client: ApiClient,
  config: IFlowConfig,
  options: DiffOptions
): Promise<void> {
  let tempDir = "";

  try {
    const version = options.version ?? config.defaultVersion ?? "active";
    const collectionsDir = path.resolve(process.cwd(), config.scriptCollectionsDir);
    const localDir = path.resolve(collectionsDir, options.id);

    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "iflow-diff-"));
    const zipBuffer = await downloadScriptCollectionZip(client, options.id, version);
    await extractGroovyZip(zipBuffer, tempDir);

    const localFiles = await listGroovyFiles(localDir);
    const remoteFiles = await listGroovyFiles(tempDir);

    const localMap = new Map(localFiles.map((filePath) => [path.basename(filePath), filePath]));
    const remoteMap = new Map(remoteFiles.map((filePath) => [path.basename(filePath), filePath]));
    const fileNames = Array.from(new Set([...localMap.keys(), ...remoteMap.keys()])).sort();

    let diffFound = false;

    for (const fileName of fileNames) {
      const localPath = localMap.get(fileName);
      const remotePath = remoteMap.get(fileName);
      const localText = localPath ? await readFileText(localPath) : "";
      const remoteText = remotePath ? await readFileText(remotePath) : "";

      const aLines = normalizeLines(localText);
      const bLines = normalizeLines(remoteText);
      const diffLines = buildDiffLines(aLines, bLines);
      const diffResult = formatUnifiedDiff(fileName, aLines, bLines, diffLines);

      if (diffResult.hasChanges) {
        console.log(diffResult.text);
        diffFound = true;
      }
    }

    if (diffFound) {
      process.exitCode = 1;
    } else {
      logger.success(`No differences found for ${options.id}`);
    }
  } catch (err) {
    logger.error(err);
    process.exit(1);
  } finally {
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
}

import path from "path";
import { ApiClient } from "../api/client";
import { getScriptCollectionMetadata } from "../api/scriptCollections";
import { IFlowConfig } from "../config/loader";
import { getLatestMtime, listGroovyFiles } from "../utils/fs";
import { logger } from "../utils/logger";

export async function runStatusCommand(client: ApiClient, config: IFlowConfig): Promise<void> {
  try {
    const collectionsDir = path.resolve(process.cwd(), config.scriptCollectionsDir);

    const rows = [] as Array<{
      name: string;
      localCount: string;
      remoteVersion: string;
      status: string;
    }>;

    for (const collection of config.collections) {
      const version = collection.iflowVersion ?? config.defaultVersion ?? "active";
      let remoteVersion = version;
      let remoteModified: number | null = null;

      try {
        const metadata = await getScriptCollectionMetadata(client, collection.id, version);
        remoteVersion = metadata.Version ?? version;
        const remoteTime =
          metadata.ModifiedAt ??
          metadata.ModifiedTime ??
          metadata.CreatedAt ??
          metadata.CreatedTime;
        remoteModified = remoteTime ? Date.parse(remoteTime) : null;
      } catch {
        remoteModified = null;
      }

      const localDir = path.resolve(collectionsDir, collection.id);
      const localFiles = await listGroovyFiles(localDir).catch((): string[] => []);
      const localLatest = await getLatestMtime(localFiles);

      const statusSymbols = {
        ok: "\u2713 in sync",
        ahead: "\u2191 ahead",
        behind: "\u2193 behind",
        unknown: "?",
      };
      let status = statusSymbols.unknown;
      if (localLatest !== null && remoteModified !== null) {
        const delta = localLatest - remoteModified;
        if (Math.abs(delta) <= 2000) {
          status = statusSymbols.ok;
        } else if (delta > 0) {
          status = statusSymbols.ahead;
        } else {
          status = statusSymbols.behind;
        }
      }

      rows.push({
        name: collection.name,
        localCount: String(localFiles.length),
        remoteVersion,
        status,
      });
    }

    const headers = ["Collection", "Local Files", "Remote Version", "Status"];
    const widths = headers.map((header, index) => {
      const values = rows.map((row) => {
        switch (index) {
          case 0:
            return row.name;
          case 1:
            return row.localCount;
          case 2:
            return row.remoteVersion;
          default:
            return row.status;
        }
      });
      return Math.max(header.length, ...values.map((value) => value.length));
    });

    const formatRow = (cols: string[]): string =>
      cols
        .map((col, index) => col.padEnd(widths[index]))
        .join(" | ")
        .trimEnd();

    console.log(formatRow(headers));
    console.log(widths.map((width) => "-".repeat(width)).join("-+-"));

    for (const row of rows) {
      console.log(formatRow([row.name, row.localCount, row.remoteVersion, row.status]));
    }
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

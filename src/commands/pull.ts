import path from "path";
import { ApiClient } from "../api/client";
import { downloadScriptCollectionZip } from "../api/scriptCollections";
import { IFlowConfig } from "../config/loader";
import { extractGroovyZip } from "../zip/handler";
import { ensureDir } from "../utils/fs";
import { logger } from "../utils/logger";

export interface PullOptions {
  id: string;
  version?: string;
}

export async function runPullCommand(
  client: ApiClient,
  config: IFlowConfig,
  options: PullOptions
): Promise<void> {
  try {
    const version = options.version ?? config.defaultVersion ?? "active";
    const collectionsDir = path.resolve(process.cwd(), config.scriptCollectionsDir);
    const collectionDir = path.resolve(collectionsDir, options.id);

    await ensureDir(collectionDir);
    const zipBuffer = await downloadScriptCollectionZip(client, options.id, version);
    const writtenFiles = await extractGroovyZip(zipBuffer, collectionDir);

    if (writtenFiles.length === 0) {
      logger.warn(`No .groovy files found in remote collection ${options.id}`);
      return;
    }

    for (const filePath of writtenFiles) {
      logger.success(`Wrote ${path.basename(filePath)}`);
    }
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

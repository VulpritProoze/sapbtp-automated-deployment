import path from "path";
import { ApiClient } from "../api/client";
import { deployScriptCollection, uploadScriptCollectionZip } from "../api/scriptCollections";
import { IFlowConfig, findCollection } from "../config/loader";
import { encodeBase64Url, zipGroovyFiles } from "../zip/handler";
import { logger } from "../utils/logger";

export interface PushOptions {
  id: string;
  version?: string;
  deploy?: boolean;
}

export async function runPushCommand(
  client: ApiClient,
  config: IFlowConfig,
  options: PushOptions
): Promise<void> {
  try {
    const version = options.version ?? config.defaultVersion ?? "active";
    const collectionsDir = path.resolve(process.cwd(), config.scriptCollectionsDir);
    const collectionDir = path.resolve(collectionsDir, options.id);
    const collection = findCollection(config, options.id);
    const collectionName = collection?.name ?? options.id;

    const zipBuffer = await zipGroovyFiles(collectionDir);
    const artifactContent = encodeBase64Url(zipBuffer);

    await uploadScriptCollectionZip(client, {
      id: options.id,
      version,
      name: collectionName,
      artifactContentBase64Url: artifactContent,
    });

    logger.success(`Uploaded script collection ${options.id} (${version})`);

    if (options.deploy) {
      await deployScriptCollection(client, options.id, version);
      logger.success(`Deployed script collection ${options.id} (${version})`);
    }
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

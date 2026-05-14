import { ApiClient } from "../api/client";
import { deployIflow } from "../api/iflow";
import { deployScriptCollection } from "../api/scriptCollections";
import { IFlowConfig, findCollection } from "../config/loader";
import { createIFlowError, logger } from "../utils/logger";

export interface DeployOptions {
  id: string;
  version?: string;
  iflow?: boolean;
}

export async function runDeployCommand(
  client: ApiClient,
  config: IFlowConfig,
  options: DeployOptions
): Promise<void> {
  try {
    const version = options.version ?? config.defaultVersion ?? "active";
    await deployScriptCollection(client, options.id, version);
    logger.success(`Deployed script collection ${options.id} (${version})`);

    if (options.iflow) {
      const collection = findCollection(config, options.id);
      if (!collection?.iflowId) {
        throw createIFlowError(
          "CONFIG_ERROR",
          `Missing iflowId for collection ${options.id} in iflow.config.json`
        );
      }

      const iflowVersion = collection.iflowVersion ?? config.defaultVersion ?? "active";
      await deployIflow(client, collection.iflowId, iflowVersion);
      logger.success(`Deployed iFlow ${collection.iflowId} (${iflowVersion})`);
    }
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

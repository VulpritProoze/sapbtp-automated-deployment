import { ApiClient } from "../api/client";
import { saveScriptCollectionAsVersion } from "../api/scriptCollections";
import { IFlowConfig } from "../config/loader";
import { logger } from "../utils/logger";

export interface VersionOptions {
  id: string;
  newVersion: string;
}

export async function runVersionCommand(
  client: ApiClient,
  config: IFlowConfig,
  options: VersionOptions
): Promise<void> {
  try {
    await saveScriptCollectionAsVersion(client, options.id, options.newVersion);
    logger.success(`Saved script collection ${options.id} as version ${options.newVersion}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

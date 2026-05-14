import fs from "fs";
import path from "path";
import { IFlowConfig } from "../config/loader";
import { ensureDir, fileExists, writeFileText } from "../utils/fs";
import { createIFlowError, logger } from "../utils/logger";

export interface InitOptions {
  id: string;
  name?: string;
}

export async function runInitCommand(
  config: IFlowConfig,
  options: InitOptions
): Promise<void> {
  try {
    const collectionsDir = path.resolve(process.cwd(), config.scriptCollectionsDir);
    const collectionDir = path.resolve(collectionsDir, options.id);
    const configPath = path.resolve(process.cwd(), "iflow.config.json");

    if (await fileExists(collectionDir)) {
      throw createIFlowError(
        "CONFIG_ERROR",
        `Collection directory already exists: ${collectionDir}`
      );
    }

    await ensureDir(collectionDir);
    await writeFileText(
      path.join(collectionDir, "README.md"),
      `# ${options.id}\n\nGroovy scripts for ${options.id}.\n`
    );
    await writeFileText(path.join(collectionDir, ".gitkeep"), "");

    const rawConfig = JSON.parse(await fs.promises.readFile(configPath, "utf-8")) as {
      collections?: Array<Record<string, unknown>>;
      defaultVersion?: string;
    };

    const collections = Array.isArray(rawConfig.collections)
      ? rawConfig.collections
      : [];

    if (collections.some((item) => item.id === options.id)) {
      throw createIFlowError(
        "CONFIG_ERROR",
        `Collection ${options.id} already exists in iflow.config.json`
      );
    }

    const displayName = options.name ?? options.id;
    const iflowVersion = config.defaultVersion ?? "active";

    collections.push({
      id: options.id,
      name: displayName,
      iflowId: "<iflow-id>",
      iflowVersion,
    });

    rawConfig.collections = collections;

    await fs.promises.writeFile(
      configPath,
      `${JSON.stringify(rawConfig, null, 2)}\n`,
      "utf-8"
    );

    logger.success(`Initialized ScriptCollections/${options.id}`);
    logger.info("Next steps:");
    logger.info(`1) Update iflowId for ${options.id} in iflow.config.json`);
    logger.info(`2) Add your .groovy files under ScriptCollections/${options.id}`);
    logger.info(`3) Run npm run push -- --id ${options.id}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

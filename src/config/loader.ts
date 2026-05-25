import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createIFlowError } from "../utils/logger";

export interface ScriptCollectionConfig {
  id: string;
  name: string;
  iflowId: string;
  iflowVersion: string;
}

export interface IFlowConfig {
  btpBaseUrl: string;
  scriptCollectionsDir: string;
  collections: ScriptCollectionConfig[];
  defaultVersion: string;
}

function assertString(value: unknown, field: string): asserts value is string {
  if (!value || typeof value !== "string") {
    throw createIFlowError("CONFIG_ERROR", `Invalid or missing ${field} in iflow.config.json`);
  }
}

function assertArray(value: unknown, field: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw createIFlowError("CONFIG_ERROR", `Invalid or missing ${field} in iflow.config.json`);
  }
}

function validateCollections(rawCollections: unknown): ScriptCollectionConfig[] {
  assertArray(rawCollections, "collections");

  return rawCollections.map((entry, index) => {
    const item = entry as ScriptCollectionConfig;
    const prefix = `collections[${index}]`;
    assertString(item.id, `${prefix}.id`);
    assertString(item.name, `${prefix}.name`);
    assertString(item.iflowId, `${prefix}.iflowId`);
    assertString(item.iflowVersion, `${prefix}.iflowVersion`);
    return item;
  });
}

function validateEnv(): void {
  const required = ["OAUTH_TOKEN_URL", "CLIENT_ID", "CLIENT_SECRET"];
  for (const name of required) {
    if (!process.env[name]) {
      throw createIFlowError("ENV_ERROR", `Missing required env var: ${name}`);
    }
  }
}

export function findCollection(
  config: IFlowConfig,
  id: string
): ScriptCollectionConfig | undefined {
  return config.collections.find((collection) => collection.id === id);
}

export function loadConfig(): IFlowConfig {
  const projectRoot = process.cwd();
  const envPath = path.resolve(projectRoot, ".env");
  dotenv.config({ path: envPath });
  validateEnv();
  const primaryConfigPath = path.resolve(projectRoot, "sapbtp.config.json");
  const fallbackConfigPath = path.resolve(projectRoot, "iflow.config.json");

  let configPath: string | undefined;
  if (fs.existsSync(primaryConfigPath)) {
    configPath = primaryConfigPath;
  } else if (fs.existsSync(fallbackConfigPath)) {
    configPath = fallbackConfigPath;
  } else {
    throw createIFlowError(
      "CONFIG_ERROR",
      `Missing config file. Expected sapbtp.config.json or iflow.config.json in ${projectRoot}`
    );
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    throw createIFlowError("CONFIG_ERROR", `Failed to parse config at ${configPath}`, undefined, err);
  }

  const config = rawConfig as Partial<IFlowConfig>;
  assertString(config.btpBaseUrl, "btpBaseUrl");

  const scriptCollectionsDir =
    typeof config.scriptCollectionsDir === "string" && config.scriptCollectionsDir
      ? config.scriptCollectionsDir
      : "ScriptCollections";

  const collections = validateCollections(config.collections);
  const defaultVersion =
    typeof config.defaultVersion === "string" && config.defaultVersion
      ? config.defaultVersion
      : "active";

  return {
    btpBaseUrl: config.btpBaseUrl,
    scriptCollectionsDir,
    collections,
    defaultVersion,
  };
}

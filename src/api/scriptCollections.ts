import axios from "axios";
import { ApiClient } from "./client";
import { createIFlowError, logger } from "../utils/logger";

export interface ScriptCollectionMetadata {
  Id: string;
  Name: string;
  Version: string;
  ModifiedAt?: string;
  ModifiedTime?: string;
  CreatedAt?: string;
  CreatedTime?: string;
}

export interface UploadScriptCollectionParams {
  id: string;
  version: string;
  name: string;
  zipBuffer: Buffer;
}

interface UploadScriptCollectionRequestBody {
  Name: string;
  ArtifactContent: string;
}

function buildCollectionPath(id: string, version: string): string {
  return `/ScriptCollectionDesigntimeArtifacts(Id='${id}',Version='${version}')`;
}

function getStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

export async function getScriptCollectionMetadata(
  client: ApiClient,
  id: string,
  version: string
): Promise<ScriptCollectionMetadata> {
  const path = buildCollectionPath(id, version);

  try {
    const response = await client.axios.get<ScriptCollectionMetadata>(path);
    return response.data;
  } catch (err) {
    throw createIFlowError(
      "API_ERROR",
      `Failed to fetch metadata for script collection ${id}`,
      getStatus(err),
      err
    );
  }
}

export async function downloadScriptCollectionZip(
  client: ApiClient,
  id: string,
  version: string
): Promise<Buffer> {
  const path = `${buildCollectionPath(id, version)}/$value`;

  try {
    logger.info(`GET ${client.axios.defaults.baseURL ?? ""}${path}`);
    const response = await client.axios.get<ArrayBuffer>(path, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  } catch (err) {
    throw createIFlowError(
      "API_ERROR",
      `Failed to download script collection ${id}`,
      getStatus(err),
      err
    );
  }
}

export async function uploadScriptCollectionZip(
  client: ApiClient,
  params: UploadScriptCollectionParams
): Promise<void> {
  const path = buildCollectionPath(params.id, params.version);
  const requestBody: UploadScriptCollectionRequestBody = {
    Name: params.name,
    ArtifactContent: params.zipBuffer.toString("base64"),
  };

  try {
    const csrfToken = await client.fetchCsrfToken(path);
    await client.axios.put(path, requestBody, {
      headers: {
        "X-CSRF-Token": csrfToken,
        "If-Match": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw createIFlowError(
      "API_ERROR",
      `Failed to upload script collection ${params.id}`,
      getStatus(err),
      err
    );
  }
}

export async function deployScriptCollection(
  client: ApiClient,
  id: string,
  version: string
): Promise<void> {
  const endpoint = "DeployScriptCollectionDesigntimeArtifact";
  const params = {
    Id: `'${id}'`,
    Version: `'${version}'`,
  };

  let csrfToken: string;
  try {
    csrfToken = await client.fetchCsrfToken(endpoint, params);
  } catch (err) {
    throw createIFlowError(
      "API_ERROR",
      `Failed to fetch CSRF token for script collection deploy ${id} via ${endpoint} (Version=${version})`,
      getStatus(err),
      err
    );
  }

  try {
    await client.axios.post(endpoint, null, {
      params,
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });
  } catch (err) {
    throw createIFlowError(
      "API_ERROR",
      `Failed to deploy script collection ${id} via ${endpoint} (Version=${version})`,
      getStatus(err),
      err
    );
  }
}

export async function saveScriptCollectionAsVersion(
  client: ApiClient,
  id: string,
  newVersion: string
): Promise<void> {
  const endpoint = "ScriptCollectionDesignTimeArtifactSaveAsVersion";
  const params = {
    Id: `'${id}'`,
    SaveAsVersion: `'${newVersion}'`,
  };

  try {
    const csrfToken = await client.fetchCsrfToken(endpoint, params);
    await client.axios.post(endpoint, null, {
      params,
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });
  } catch (err) {
    throw createIFlowError(
      "API_ERROR",
      `Failed to save script collection ${id} as version ${newVersion}`,
      getStatus(err),
      err
    );
  }
}

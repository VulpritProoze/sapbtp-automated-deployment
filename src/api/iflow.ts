import axios from "axios";
import { ApiClient } from "./client";
import { createIFlowError } from "../utils/logger";

function getStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

export async function deployIflow(client: ApiClient, id: string, version: string): Promise<void> {
  const endpoint = "DeployIntegrationDesigntimeArtifact";
  const params = {
    Id: `'${id}'`,
    Version: `'${version}'`,
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
    throw createIFlowError("API_ERROR", `Failed to deploy iFlow ${id}`, getStatus(err), err);
  }
}

import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "../auth/oauth";
import { createIFlowError } from "../utils/logger";

export interface ApiClient {
  axios: AxiosInstance;
  fetchCsrfToken: (path: string) => Promise<string>;
}

export function createApiClient(baseUrl: string): ApiClient {
  if (!baseUrl) {
    throw createIFlowError("CONFIG_ERROR", "btpBaseUrl is required in iflow.config.json");
  }

  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      Accept: "application/json",
    },
    timeout: 30_000,
  });

  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    const headers = config.headers ?? {};
    headers.Authorization = `Bearer ${token}`;
    config.headers = headers;
    return config;
  });

  let csrfToken: string | null = null;

  const fetchCsrfToken = async (path: string): Promise<string> => {
    if (csrfToken) {
      return csrfToken;
    }

    try {
      const response = await client.get(path, {
        headers: {
          "X-CSRF-Token": "Fetch",
        },
      });

      const token = response.headers["x-csrf-token"] as string | undefined;
      if (!token) {
        throw createIFlowError("CSRF_ERROR", "CSRF token missing from response headers");
      }

      csrfToken = token;
      return csrfToken;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      throw createIFlowError("CSRF_ERROR", "Failed to fetch CSRF token", status, err);
    }
  };

  return { axios: client, fetchCsrfToken };
}

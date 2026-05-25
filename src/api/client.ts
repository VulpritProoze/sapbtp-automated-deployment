import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { getAccessToken } from "../auth/oauth";
import { createIFlowError } from "../utils/logger";

export interface ApiClient {
  axios: AxiosInstance;
  fetchCsrfToken: (path: string, params?: Record<string, string>) => Promise<string>;
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

  let cookieHeader: string | undefined;

  function updateCookieHeader(setCookieHeader: string[] | string | undefined): void {
    if (!setCookieHeader) {
      return;
    }

    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    const normalizedCookies = cookies
      .map((cookie) => cookie.split(";")[0]?.trim())
      .filter((cookie): cookie is string => Boolean(cookie));

    if (normalizedCookies.length > 0) {
      cookieHeader = normalizedCookies.join("; ");
    }
  }

  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }
    config.headers = headers;
    return config;
  });

  let csrfToken: string | null = null;

  const fetchCsrfToken = async (path: string, params?: Record<string, string>): Promise<string> => {
    if (csrfToken) {
      return csrfToken;
    }

    try {
      const response = await client.get(path, {
        headers: {
          "X-CSRF-Token": "Fetch",
        },
        params,
      });

      updateCookieHeader(response.headers["set-cookie"]);

      const token = response.headers["x-csrf-token"] as string | undefined;
      if (!token) {
        throw createIFlowError("CSRF_ERROR", "CSRF token missing from response headers");
      }

      csrfToken = token;
      return csrfToken;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (axios.isAxiosError(err)) {
        const tokenFromError = err.response?.headers?.["x-csrf-token"] as string | undefined;
        if (tokenFromError) {
          updateCookieHeader(err.response.headers["set-cookie"]);
          csrfToken = tokenFromError;
          return csrfToken;
        }
      }
      throw createIFlowError("CSRF_ERROR", "Failed to fetch CSRF token", status, err);
    }
  };

  return { axios: client, fetchCsrfToken };
}

import axios from "axios";
import { createIFlowError } from "../utils/logger";

interface OAuthTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function getEnvValue(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw createIFlowError("ENV_ERROR", `Missing required env var: ${name}`);
  }
  return value;
}

function resolveOAuthEnv(): {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
} {
  return {
    tokenUrl: getEnvValue("OAUTH_TOKEN_URL"),
    clientId: getEnvValue("CLIENT_ID"),
    clientSecret: getEnvValue("CLIENT_SECRET"),
  };
}

export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const { tokenUrl, clientId, clientSecret } = resolveOAuthEnv();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await axios.post<OAuthTokenResponse>(tokenUrl, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.data?.access_token) {
      throw createIFlowError("AUTH_ERROR", "OAuth token response missing access_token");
    }

    const expiresIn = response.data.expires_in ?? 0;
    const refreshSkewMs = 30_000;
    tokenCache = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + Math.max(0, expiresIn * 1000 - refreshSkewMs),
    };

    return tokenCache.accessToken;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    throw createIFlowError("AUTH_ERROR", "Failed to fetch OAuth token", status, err);
  }
}

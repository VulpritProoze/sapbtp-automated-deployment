const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

export interface IFlowError extends Error {
  code: string;
  httpStatus?: number;
  cause?: unknown;
}

export function createIFlowError(
  code: string,
  message: string,
  httpStatus?: number,
  cause?: unknown
): IFlowError {
  const error = new Error(message) as IFlowError;
  error.code = code;
  error.httpStatus = httpStatus;
  error.cause = cause;
  return error;
}

function isIFlowError(err: unknown): err is IFlowError {
  return Boolean(err) && typeof err === "object" && "code" in err && "message" in err;
}

function formatError(err: unknown): string {
  if (isIFlowError(err)) {
    if (isNetworkError(err.cause)) {
      return "Could not reach SAP BTP -- check btpBaseUrl and VPN";
    }
    const status = err.httpStatus ? ` (HTTP ${err.httpStatus})` : "";
    const backendDetails = extractBackendDetails(err.cause);
    return `${err.message}${status}${backendDetails}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return String(err);
}

function extractBackendDetails(cause: unknown): string {
  if (!cause || typeof cause !== "object") {
    return "";
  }

  const maybeError = cause as {
    response?: {
      data?: unknown;
      headers?: Record<string, unknown>;
    };
  };

  const response = maybeError.response;
  if (!response) {
    return "";
  }

  let backendMessage = "";
  const data = response.data as
    | {
        error?: {
          message?: {
            value?: unknown;
          };
        };
      }
    | undefined;

  if (typeof data?.error?.message?.value === "string" && data.error.message.value.trim()) {
    backendMessage = data.error.message.value.trim();
  }

  const headers = response.headers ?? {};
  const correlationId =
    typeof headers["x-correlationid"] === "string"
      ? headers["x-correlationid"]
      : typeof headers["x-request-id"] === "string"
        ? headers["x-request-id"]
        : "";

  const messagePart = backendMessage ? ` | SAP: ${backendMessage}` : "";
  const correlationPart = correlationId ? ` | CorrelationId: ${correlationId}` : "";
  return `${messagePart}${correlationPart}`;
}

function isNetworkError(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") {
    return false;
  }

  const maybeError = cause as {
    code?: string;
    isAxiosError?: boolean;
    response?: unknown;
    message?: string;
  };

  if (maybeError.code === "ECONNABORTED") {
    return true;
  }

  if (maybeError.isAxiosError && !maybeError.response) {
    return true;
  }

  if (
    typeof maybeError.message === "string" &&
    maybeError.message.toLowerCase().includes("timeout")
  ) {
    return true;
  }

  return false;
}

function print(color: string, message: string): void {
  console.log(`${color}${message}${colors.reset}`);
}

export const logger = {
  info: (message: string): void => print(colors.blue, message),
  success: (message: string): void => print(colors.green, message),
  warn: (message: string): void => print(colors.yellow, message),
  error: (err: unknown): void => {
    const message = formatError(err);
    console.error(`${colors.red}${message}${colors.reset}`);
  },
};

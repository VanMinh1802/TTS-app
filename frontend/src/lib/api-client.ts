import { notificationService } from "@/shared/notifications/notification-store";

const DEFAULT_API_URL = "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const getApiBaseUrl = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return "https://tts-app-imdy.onrender.com/api";
  }
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return configuredUrl.replace(/\/$/, "");
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const fallbackMessage = `Request failed (${response.status} ${response.statusText})`;

  try {
    const data = (await response.json()) as {
      detail?: string;
      message?: string;
      error?: string;
    };

    if (typeof data.detail === "string") {
      return data.detail;
    }

    return data.message ?? data.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

type ApiRequestOptions = RequestInit & {
  allowEmpty?: boolean;
  expectJson?: boolean;
  responseType?: "json" | "blob" | "text";
  _isRetry?: boolean;
};

const isJsonRequestBody = (body: BodyInit | null | undefined): boolean => {
  if (body === undefined || body === null) return false;
  if (typeof body === "string") return true;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  return false;
};

const buildHeaders = (headers: HeadersInit | undefined, hasJsonBody: boolean): Headers => {
  const requestHeaders = new Headers(headers);

  if (hasJsonBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  return requestHeaders;
};

const attachCsrfToken = (headers: Headers, method: string): void => {
  const mutating = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  if (!mutating) return;
  const getCsrfCookie = (): string => {
    const match = document.cookie.split("; ").find(row => row.startsWith("csrf_token="));
    return match ? decodeURIComponent(match.split("=")[1]) : "";
  };
  const csrf = getCsrfCookie();
  if (csrf) {
    headers.set("X-CSRF-Token", csrf);
  }
};

const readSuccessPayload = async <T>(
  response: Response,
  options: { allowEmpty: boolean; expectJson: boolean },
): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  if (!options.expectJson) {
    return undefined as T;
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    if (options.allowEmpty) {
      return undefined as T;
    }

    throw new Error(`Expected JSON response but received '${contentType || "unknown content type"}'`);
  }

  const bodyText = await response.text();
  if (!bodyText) {
    if (options.allowEmpty) {
      return undefined as T;
    }

    throw new Error("Expected JSON response body but received empty payload");
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error("Invalid JSON response from API");
  }
};

/**
 * Try to silently refresh the access token using the refresh_token cookie.
 * Returns true if refresh succeeded.
 */
let refreshPromise: Promise<boolean> | null = null;

const tryRefreshToken = async (): Promise<boolean> => {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          window.dispatchEvent(new Event("auth-state-changed"));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Auth] Token refresh failed:', err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const {
    allowEmpty = false,
    expectJson = true,
    responseType = "json",
    _isRetry = false,
    headers,
    ...fetchOptions
  } = options;

  const hasJsonBody = isJsonRequestBody(fetchOptions.body);
  const requestHeaders = buildHeaders(headers, hasJsonBody);
  attachCsrfToken(requestHeaders, fetchOptions.method ?? "GET");

  const token = localStorage.getItem("access_token");
  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...fetchOptions,
    credentials: "include",
    headers: requestHeaders,
  });

  if (!response.ok) {
    // On 401, try silent refresh (once) — except for /auth/* endpoints
    const isAuthEndpoint = path.startsWith("/auth/");
    if (response.status === 401 && !_isRetry && typeof window !== "undefined" && !isAuthEndpoint) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return apiRequest<T>(path, { ...options, _isRetry: true });
      }

      // Refresh failed — session is truly expired
      localStorage.removeItem("access_token");
      window.dispatchEvent(new Event("auth-state-changed"));
      notificationService.notify({
        severity: "warning",
        title: "Session expired",
        message: "Your session has expired. Please sign in again.",
        source: "auth",
      });
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (typeof window !== "undefined" && response.status !== 401) {
      const severity = response.status === 429 ? "warning" : "error";
      const title = response.status === 429 ? "Rate limit reached" : "Request failed";
      notificationService.notify({
        severity,
        title,
        message:
          response.status === 429
            ? "You have reached the current limit. Try again later."
            : "We could not complete the request. Please try again.",
        source: "api",
      });
    }

    const errorMessage = await readErrorMessage(response);
    throw new ApiError(errorMessage, response.status);
  }

  if (responseType === "blob") {
    return response.blob() as Promise<T>;
  }

  if (responseType === "text") {
    return response.text() as Promise<T>;
  }

  return readSuccessPayload<T>(response, { allowEmpty, expectJson });
};

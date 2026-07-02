import { getApiBaseUrl } from "./config";

/** Error carrying the API HTTP status so callers can branch or surface a message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiRequest {
  method?: HttpMethod;
  body?: unknown;
  bearer?: string;
}

/** Readable pt-BR message for an API status (used when the body has none). */
export function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Dados inválidos.";
    case 401:
      return "Sessão expirada ou inválida. Entre novamente.";
    case 403:
      return "Sem permissão para esta ação.";
    case 404:
      return "Registro não encontrado.";
    case 409:
      return "Conflito: o registro já existe.";
    default:
      return "Erro inesperado. Tente novamente.";
  }
}

/** Builds the fetch init (pure) so request shaping is testable without the network. */
export function buildRequestInit(req: ApiRequest): RequestInit {
  const { method = "GET", body, bearer } = req;
  const headers: Record<string, string> = {};
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  const hasBody = body !== undefined && method !== "GET";
  if (hasBody) headers["content-type"] = "application/json";
  return {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
    // The BFF must always hit the API fresh; no Next data cache for tenant data.
    cache: "no-store",
  };
}

/** Server-side call to the API. Throws ApiError on a non-2xx response. */
export async function apiFetch<T>(path: string, req: ApiRequest = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, buildRequestInit(req));

  if (!response.ok) {
    let message = messageForStatus(response.status);
    try {
      const data = (await response.json()) as { message?: unknown };
      if (typeof data.message === "string" && data.message.trim()) {
        message = data.message;
      }
    } catch {
      // Non-JSON body — keep the status-derived message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

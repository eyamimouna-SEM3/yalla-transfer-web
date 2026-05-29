import { tokenStorage } from "@/utils/tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type ApiOptions = RequestInit & { params?: Record<string, unknown> };

export const apiCall = async <T = unknown>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> => {
  const { params, ...fetchOptions } = options;
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) queryString.set(key, String(value));
    });
    if (queryString.toString()) url += `?${queryString.toString()}`;
  }

  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");

  const token = tokenStorage.getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: data.message || `HTTP ${response.status}`,
      data,
    };
  }

  return response.json() as Promise<T>;
};

export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiCall<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiCall<T>(endpoint, { ...options, method: "DELETE" }),
};

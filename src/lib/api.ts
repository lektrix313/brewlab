/**
 * API client for the Cloudflare Workers backend.
 * Automatically attaches the Clerk JWT to every request.
 */

const API_BASE_URL = __DEV__
  ? 'http://192.168.1.XXX:8788' // Update this to your local IP for physical device testing
  : 'https://brewlab-api.beatjaxx.workers.dev'; // Production Worker URL

// Override for local dev with emulator/simulator
const DEV_URL = 'http://127.0.0.1:8788';

export function getApiBaseUrl(): string {
  if (__DEV__) {
    // For iOS simulator, localhost works. For Android emulator, use 10.0.2.2.
    // For physical devices, use your machine's local network IP.
    return DEV_URL;
  }
  return API_BASE_URL;
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<{ data: T }> {
  const { method = 'GET', body, token } = options;
  const url = `${getApiBaseUrl()}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || `API error: ${res.status}`);
  }

  return json as { data: T };
}

// Convenience methods
export const apiClient = {
  get: <T>(path: string, token?: string | null) => api<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    api<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body: unknown, token?: string | null) =>
    api<T>(path, { method: 'PUT', body, token }),
  del: <T>(path: string, token?: string | null) => api<T>(path, { method: 'DELETE', token }),
};

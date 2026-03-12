/**
 * Base URL backend API, dibaca dari environment variable.
 * Gunakan NEXT_PUBLIC_API_URL di .env.local untuk development
 * dan di platform deployment (Vercel, Railway, dll) untuk production.
 *
 * Contoh .env.local:
 *   NEXT_PUBLIC_API_URL=http://localhost:4000/api
 *
 * Contoh production:
 *   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/**
 * Helper fetch dengan credentials (cookie HttpOnly) sudah disertakan otomatis.
 * Gunakan ini sebagai pengganti fetch biasa untuk semua request ke backend.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Helper GET — melempar error jika response tidak ok.
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await apiFetch(endpoint);
  if (!res.ok) throw new Error(`GET ${endpoint} gagal: ${res.status}`);
  return res.json() as Promise<T>;
}
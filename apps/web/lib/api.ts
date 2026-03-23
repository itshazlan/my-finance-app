/**
 * Base URL backend API, sekarang diarahkan ke /api
 * karena kita mem-proxy semua request lewat Next.js di next.config.js.
 * Ini memastikan issue login cross-domain cookie terpecahkan.
 * (Vercel middleware akan bisa membaca token-nya).
 */
export const API_URL = "/api";

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
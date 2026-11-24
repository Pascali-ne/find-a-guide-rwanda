const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");
const TOKEN_KEY = "fag_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Turns a server-relative path (e.g. /uploads/photos/x.jpg) into a full URL. */
export const assetUrl = (path?: string | null): string | null =>
  path ? (path.startsWith("http") ? path : `${API_URL}${path}`) : null;

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown, isForm = false): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Please check that the API is running and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event("fag:logout"));
    }
    throw new ApiError(res.status, data?.message ?? "Something went wrong.", data?.fields ?? {});
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body ?? {}),
  put: <T>(url: string, body: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body: unknown) => request<T>("PATCH", url, body),
  upload: <T>(url: string, form: FormData) => request<T>("POST", url, form, true),
  /** Downloads a protected file and opens it in a new tab. */
  async openFile(url: string): Promise<void> {
    const token = tokenStore.get();
    const res = await fetch(`${API_URL}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new ApiError(res.status, "The document could not be opened.");
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank", "noopener");
  },
};

export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : "Something went wrong.");

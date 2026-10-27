export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: {} };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // zod-validator returns { success, error }, our handlers return { error: string }
    const message = typeof data?.error === "string" ? data.error : res.status === 400 ? "Please check the form values" : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  // Let listeners (the backoffice live preview) know that saved data changed.
  if (method !== "GET") window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
  return data as T;
}

export const DATA_CHANGED_EVENT = "mune:data-changed";

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  put: <T>(url: string, body?: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  del: <T>(url: string) => request<T>("DELETE", url),
};

export const imageUrl = (key: string) => `/img/${key}`;

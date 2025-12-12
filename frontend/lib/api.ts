// Ensure baseURL points to backend, e.g.:
export const api = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
};

async function buildHeaders(token?: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(init && (init as any).headers),
  };

  // prefer explicit token param; fallback to localStorage token for client-side calls
  let finalToken = token;
  if (!finalToken && typeof window !== "undefined") {
    finalToken = localStorage.getItem("token") || undefined;
  }

  if (finalToken) {
    headers["Authorization"] = `Bearer ${finalToken}`;
  }

  return headers;
}

export async function apiGet<T = unknown>(
  path: string,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await buildHeaders(token, init);
  const res = await fetch(`${api.baseURL}${path}`, {
    method: "GET",
    headers,
    ...init,
  });
  if (!res.ok) {
    let errText = "Server error";
    try {
      errText = (await res.json()).error || JSON.stringify(await res.json());
    } catch {}
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T = unknown>(
  path: string,
  data: unknown,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await buildHeaders(token, init);
  const res = await fetch(`${api.baseURL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    ...init,
  });
  if (!res.ok) {
    let errText = "Server error";
    try {
      errText = (await res.json()).error || JSON.stringify(await res.json());
    } catch {}
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiPut<T = unknown>(
  path: string,
  data: unknown,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await buildHeaders(token, init);
  const res = await fetch(`${api.baseURL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
    ...init,
  });
  if (!res.ok) {
    let errText = "Server error";
    try {
      errText = (await res.json()).error || JSON.stringify(await res.json());
    } catch {}
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiDelete<T = unknown>(
  path: string,
  token?: string,
  init: RequestInit = {}
): Promise<T | null> {
  const headers = await buildHeaders(token, init);
  const res = await fetch(`${api.baseURL}${path}`, {
    method: "DELETE",
    headers,
    ...init,
  });
  if (!res.ok) {
    let errText = "Server error";
    try {
      errText = (await res.json()).error || JSON.stringify(await res.json());
    } catch {}
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  try {
    const body = await res.json();
    return body as T;
  } catch {
    return null;
  }
}


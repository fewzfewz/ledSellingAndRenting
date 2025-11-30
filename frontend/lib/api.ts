const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

function authHeaders() {
  if (typeof window === 'undefined') return {} as Record<string, string>;
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function apiPost(path: string, data: any, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let msg = `API error: ${res.status} ${res.statusText}`;
    try {
      const error = await res.json();
      msg = error.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiDelete(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  try { return await res.json(); } catch { return null; }
}

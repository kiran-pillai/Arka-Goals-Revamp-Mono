const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Thin fetch client for the backend. Always sends the session cookie
 * (`credentials: 'include'`) and JSON-encodes bodies. Throws ApiError on
 * non-2xx — TanStack Query relies on the queryFn throwing to detect errors.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!res.ok) {
    const message = await res
      .json()
      .then((b) => (b as { message?: string }).message)
      .catch(() => undefined)
    throw new ApiError(res.status, message ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json().catch(() => undefined as T)
}

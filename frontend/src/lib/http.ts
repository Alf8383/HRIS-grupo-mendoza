import { appEnv } from '@/lib/env'
import type { ApiEnvelope } from '@/types/api'

export class ApiClientError extends Error {
  status: number
  code?: string
  details?: Record<string, unknown> | null

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown> | null,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = RequestInit & {
  token?: string
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${appEnv.apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  const payload =
    ((await response.json().catch(() => null)) as ApiEnvelope<T> | null) ?? null

  if (
    !response.ok ||
    !payload?.success ||
    payload.data === null ||
    payload.data === undefined
  ) {
    throw new ApiClientError(
      payload?.error?.message ?? 'No se pudo completar la operación.',
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    )
  }

  return payload.data
}

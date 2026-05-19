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

export async function downloadApiFile(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${appEnv.apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload =
      ((await response.json().catch(() => null)) as ApiEnvelope<unknown> | null) ?? null

    throw new ApiClientError(
      payload?.error?.message ?? 'No se pudo completar la operación.',
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    )
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
  const filename = filenameMatch?.[1] ?? 'reporte.xlsx'
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export function getApiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return fallback
}

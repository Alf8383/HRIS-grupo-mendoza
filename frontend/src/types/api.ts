export type ApiEnvelope<T> = {
  success: boolean
  data: T | null
  error: {
    code: string
    message: string
    details?: Record<string, unknown> | null
  } | null
  timestamp: string
}

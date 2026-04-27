export function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return 'Sin registro'
  }

  try {
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function formatTime(value: string | null) {
  if (!value) {
    return 'Sin registro'
  }

  try {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

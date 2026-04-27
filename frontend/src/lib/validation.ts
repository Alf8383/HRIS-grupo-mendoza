export type FieldError = { message: string }

export function validateEmail(value: string): FieldError | null {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(value)) {
    return { message: 'Ingresa un correo válido.' }
  }
  return null
}

export function validateDni(value: string): FieldError | null {
  if (!/^\d{8}$/.test(value)) {
    return { message: 'El DNI debe tener 8 dígitos.' }
  }
  return null
}

export function validatePhone(value: string): FieldError | null {
  if (!value) return null
  if (!/^\+?[\d\s-]{7,15}$/.test(value)) {
    return { message: 'Ingresa un número de teléfono válido.' }
  }
  return null
}

export function validatePassword(value: string): FieldError | null {
  if (value.length < 8) {
    return { message: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  return null
}

export function validateRequired(value: string): FieldError | null {
  if (!value.trim()) {
    return { message: 'Este campo es obligatorio.' }
  }
  return null
}

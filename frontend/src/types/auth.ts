export type CurrentUser = {
  id: number
  name: string
  email: string
  roles: string[]
  status: string
}

export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: CurrentUser
}

export type UserSession = {
  token: string
  expiresAt?: number
  user: CurrentUser
}

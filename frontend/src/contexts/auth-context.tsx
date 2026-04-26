import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { clearSession, loadSession, saveSession } from '@/lib/auth-storage'
import { ApiClientError, apiRequest } from '@/lib/http'
import type { AuthResponse, CurrentUser, UserSession } from '@/types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  session: UserSession | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => loadSession())
  const [status, setStatus] = useState<AuthStatus>(() =>
    loadSession()?.token ? 'loading' : 'unauthenticated',
  )

  const bootstrapSession = async (storedSession: UserSession) => {
    try {
      const user = await apiRequest<CurrentUser>('/auth/me', {
        method: 'GET',
        token: storedSession.token,
      })

      const nextSession = {
        ...storedSession,
        user,
      }

      saveSession(nextSession)
      startTransition(() => {
        setSession(nextSession)
        setStatus('authenticated')
      })
    } catch {
      clearSession()
      startTransition(() => {
        setSession(null)
        setStatus('unauthenticated')
      })
    }
  }

  useEffect(() => {
    const storedSession = loadSession()

    if (!storedSession?.token) {
      return
    }

    void bootstrapSession(storedSession)
  }, [])

  async function login(email: string, password: string) {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const nextSession: UserSession = {
      token: response.accessToken,
      expiresAt: Date.now() + response.expiresIn,
      user: response.user,
    }

    saveSession(nextSession)
    startTransition(() => {
      setSession(nextSession)
      setStatus('authenticated')
    })
  }

  async function refreshCurrentUser() {
    if (!session?.token) {
      throw new ApiClientError('No hay sesión activa.', 401)
    }

    const user = await apiRequest<CurrentUser>('/auth/me', {
      method: 'GET',
      token: session.token,
    })

    const nextSession = {
      ...session,
      user,
    }

    saveSession(nextSession)
    setSession(nextSession)
  }

  function logout() {
    clearSession()
    setSession(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        login,
        logout,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

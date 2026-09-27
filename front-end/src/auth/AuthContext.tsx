import { createContext, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import type { AuthUser } from './auth'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  /** Re-fetch /auth/me (e.g. right after verifying a magic link). */
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const ME_KEY = ['auth', 'me'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<AuthUser | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api<AuthUser>('/auth/me')
      } catch (err) {
        // Not signed in — a 401 is expected, not an error state.
        if (err instanceof ApiError && err.status === 401) return null
        throw err
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ME_KEY })
  }, [qc])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' })
    qc.setQueryData(ME_KEY, null)
  }, [qc])

  return (
    <AuthContext.Provider
      value={{ user: data ?? null, loading: isLoading, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

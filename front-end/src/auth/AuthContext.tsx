import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { AuthUser } from './auth'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Helper to map Supabase User to our local AuthUser shape
const mapUser = (user: User | null): AuthUser | null => {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    role: 'MEMBER', // We will configure admin roles via user metadata later
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapUser(session?.user ?? null))
      setLoading(false)
    })

    // Listen for auth state changes (including magic link callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(mapUser(session?.user ?? null))
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
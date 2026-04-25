import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getToken, setToken, removeToken } from '../api/client'
import { authService } from '../api/authService'
import type { PerfilMinimo } from '../types'

interface AuthState {
  token: string | null
  perfil: PerfilMinimo | null
  loading: boolean
  login: (oidcToken: string, provider: 'CIUDADANIA_DIGITAL' | 'GOOGLE') => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function parseJwtPayload(token: string): PerfilMinimo | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.sub,
      nombre_completo: payload.nombre_completo ?? null,
      correo: payload.correo ?? null,
      area: payload.area ?? null,
      rol: payload.rol,
      estado: payload.estado ?? 'ACTIVO',
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTk] = useState<string | null>(getToken)
  const [perfil, setPerfil] = useState<PerfilMinimo | null>(() => {
    const t = getToken()
    return t ? parseJwtPayload(t) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = getToken()
    if (t && !perfil) setPerfil(parseJwtPayload(t))
  }, [])

  const login = async (oidcToken: string, provider: 'CIUDADANIA_DIGITAL' | 'GOOGLE') => {
    setLoading(true)
    try {
      const res = await authService.login(oidcToken, provider)
      setToken(res.access_token)
      setTk(res.access_token)
      setPerfil(res.perfil)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    setTk(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ token, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

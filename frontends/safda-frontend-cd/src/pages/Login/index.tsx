import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components'

/**
 * Flujo OIDC simulado para Ciudadanía Digital.
 * En producción, se redirige al authorization_endpoint del IDP.
 * El callback en /auth/callback recibe el code/token y llama al backend.
 */
function buildCDAuthUrl(): string {
  const issuer      = import.meta.env.VITE_CD_ISSUER      ?? 'https://ciudadania.gob.bo'
  const clientId    = import.meta.env.VITE_CD_CLIENT_ID   ?? 'demo_client'
  const redirectUri = import.meta.env.VITE_CD_REDIRECT_URI ?? 'http://localhost:4200/auth/callback'
  const scope       = import.meta.env.VITE_CD_SCOPE        ?? 'openid profile email'
  const state       = crypto.randomUUID()
  const nonce       = crypto.randomUUID()
  sessionStorage.setItem('oidc_state', state)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope,
    state,
    nonce,
  })
  return `${issuer}/authorize?${params}`
}

export default function LoginPage() {
  const { token, login, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (token) navigate('/bandeja-entrada', { replace: true })
  }, [token, navigate])

  // Manejo del callback OIDC (cuando vuelve con ?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const state  = params.get('state')
    if (!code) return
    const savedState = sessionStorage.getItem('oidc_state')
    if (state !== savedState) { setError('Estado OIDC inválido. Intentá de nuevo.'); return }
    sessionStorage.removeItem('oidc_state')
    // En un flujo real, intercambiarías el code por un token en el backend.
    // Aquí enviamos el code directamente como token de demostración.
    login(code, 'CIUDADANIA_DIGITAL')
      .then(() => navigate('/bandeja-entrada', { replace: true }))
      .catch(() => setError('Error al autenticar con Ciudadanía Digital.'))
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-700/20 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
              <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
                <rect width="40" height="40" rx="10" fill="#2538cb"/>
                <path d="M10 20h20M20 10v20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="2.5"/>
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">SAFDA</h1>
            <p className="mt-1 text-center text-sm text-primary-200">
              Sistema de Administración y Flujo<br />Documental Administrativo
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium text-primary-300">Portal Funcionarios</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={() => { window.location.href = buildCDAuthUrl() }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-primary-800 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-600" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            )}
            Ingresar con Ciudadanía Digital
          </button>

          <p className="mt-6 text-center text-xs text-primary-300">
            Al ingresar aceptás los términos de uso del sistema.<br />
            Solo funcionarios autorizados pueden acceder.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-primary-400">
          Estado Plurinacional de Bolivia · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components'

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID ?? 'your-google-client-id'

// Tipos de error para mostrar mensajes específicos
type ErrorType = 'pendiente' | 'no_autorizado' | 'google_error' | 'generico' | null

interface ErrorInfo {
  tipo: ErrorType
  mensaje: string
  detalle?: string
}

function LoginContent() {
  const { token, login, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [intentando, setIntentando] = useState(false)

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return

    setError(null)
    setIntentando(true)

    try {
      await login(credentialResponse.credential, 'GOOGLE')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      // Extraer el mensaje real del backend
      const statusCode = err?.response?.status ?? err?.status
      const mensajeBackend: string =
        err?.response?.data?.message ??
        err?.message ??
        ''

      // Clasificar el error según el mensaje o código HTTP
      if (
        statusCode === 401 &&
        mensajeBackend.toLowerCase().includes('pendiente')
      ) {
        setError({
          tipo: 'pendiente',
          mensaje: 'Tu cuenta está pendiente de activación.',
          detalle: 'Un administrador debe asignarte un área y rol antes de que puedas acceder. Contactá al responsable del sistema.',
        })
      } else if (statusCode === 401 || statusCode === 403) {
        setError({
          tipo: 'no_autorizado',
          mensaje: 'No tenés permisos para acceder.',
          detalle: mensajeBackend || 'Tu cuenta no está habilitada para este sistema.',
        })
      } else {
        setError({
          tipo: 'generico',
          mensaje: 'Error al autenticar con Google.',
          detalle: 'Verificá tu conexión e intentá nuevamente.',
        })
      }
    } finally {
      setIntentando(false)
    }
  }

  const handleGoogleError = () => {
    setError({
      tipo: 'google_error',
      mensaje: 'Error al conectar con Google.',
      detalle: 'No se pudo iniciar el flujo de autenticación. Intentá nuevamente.',
    })
  }

  // Íconos para cada tipo de error
  const errorIcono: Record<NonNullable<ErrorType>, string> = {
    pendiente: '⏳',
    no_autorizado: '🚫',
    google_error: '⚠️',
    generico: '⚠️',
  }

  // Colores de borde según tipo de error
  const errorBorde: Record<NonNullable<ErrorType>, string> = {
    pendiente: 'border-amber-400/40 bg-amber-950/30',
    no_autorizado: 'border-red-400/40 bg-red-950/30',
    google_error: 'border-orange-400/40 bg-orange-950/30',
    generico: 'border-red-400/40 bg-red-950/30',
  }

  const errorTexto: Record<NonNullable<ErrorType>, string> = {
    pendiente: 'text-amber-300',
    no_autorizado: 'text-red-300',
    google_error: 'text-orange-300',
    generico: 'text-red-300',
  }

  const errorDetalle: Record<NonNullable<ErrorType>, string> = {
    pendiente: 'text-amber-400/70',
    no_autorizado: 'text-red-400/70',
    google_error: 'text-orange-400/70',
    generico: 'text-red-400/70',
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
              <span className="font-display text-2xl font-bold text-white">S</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">SAFDA</h1>
            <p className="mt-2 text-sm text-slate-400">Sistema de Gestión Documental Administrativa</p>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-center text-xs text-slate-400">
              🔒 Acceso exclusivo solo para{' '}
              <span className="font-semibold text-primary-300">personal de la institucion</span>
            </p>
          </div>

          {/* ── Bloque de error ── */}
          {error && (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 transition-all ${errorBorde[error.tipo!]}`}
            >
              <p className={`flex items-center gap-2 text-sm font-semibold ${errorTexto[error.tipo!]}`}>
                <span>{errorIcono[error.tipo!]}</span>
                {error.mensaje}
              </p>
              {error.detalle && (
                <p className={`mt-1 text-xs leading-relaxed ${errorDetalle[error.tipo!]}`}>
                  {error.detalle}
                </p>
              )}
            </div>
          )}

          {/* Google Login */}
          {loading || intentando ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner />
              {intentando && (
                <p className="text-xs text-slate-500">Verificando credenciales…</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                shape="rectangular"
                text="signin_with"
                width="320"
              />
              <p className="text-xs text-slate-500">
                Solo cuentas Google autorizadas pueden acceder
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Estado Plurinacional de Bolivia · SAFDA v1.0 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginContent />
    </GoogleOAuthProvider>
  )
}

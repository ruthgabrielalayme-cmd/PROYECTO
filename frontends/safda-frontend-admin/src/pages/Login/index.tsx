import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components'

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID ?? 'your-google-client-id'

function LoginContent() {
  const { token, login, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return
    try {
      await login(credentialResponse.credential, 'GOOGLE')
      navigate('/dashboard', { replace: true })
    } catch {
      alert('Error al autenticar con Google. Verificá que tengas permisos de administrador.')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
              <span className="font-display text-2xl font-bold text-white">S</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Panel Admin</h1>
            <p className="mt-2 text-sm text-slate-400">SAFDA — Sistema de Gestión Documental</p>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-center text-xs text-slate-400">
              🔒 Acceso exclusivo para <span className="font-semibold text-primary-300">administradores institucionales</span>
            </p>
          </div>

          {/* Google Login */}
          {loading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert('Error con Google Sign-In')}
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

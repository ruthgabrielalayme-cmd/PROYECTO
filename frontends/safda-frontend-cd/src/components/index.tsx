import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { EstadoDocumento, EstadoDerivacion, TipoBandeja } from '../types'

// ─── Navbar ───────────────────────────────────────────────────────────────
export function Navbar() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()

  const links = [
    { to: '/bandeja-entrada', label: 'Bandeja Entrada' },
    { to: '/bandeja-salida', label: 'Bandeja Salida' },
    { to: '/documentos', label: 'Documentos' },
    { to: '/hojas-ruta', label: 'Hojas de Ruta' },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/bandeja-entrada" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <span className="text-xs font-bold text-white">S</span>
          </div>
          <span className="font-display text-base font-700 text-slate-800">SAFDA</span>
          <span className="hidden rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 sm:block">
            Ciudadanía Digital
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                loc.pathname.startsWith(l.to)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {perfil && (
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-semibold text-slate-800">
                {perfil.nombre_completo ?? perfil.correo ?? 'Usuario'}
              </span>
              <span className="text-xs text-slate-500">{perfil.area ?? 'Sin área'} · {perfil.rol}</span>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}

// ─── Page Shell ───────────────────────────────────────────────────────────
export function PageShell({ title, subtitle, action, children }: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <svg className={`${s} animate-spin text-primary-600`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: {
  icon: string; title: string; description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

// ─── Estado Badges ────────────────────────────────────────────────────────
const estadoDoc: Record<EstadoDocumento, string> = {
  BORRADOR:         'bg-slate-100 text-slate-600',
  PDF_SUBIDO:       'bg-blue-100 text-blue-700',
  EN_FLUJO:         'bg-green-100 text-green-700',
  FINALIZADO:       'bg-slate-200 text-slate-800',
}
const estadoDocLabel: Record<EstadoDocumento, string> = {
  BORRADOR:         'Borrador',
  PDF_SUBIDO:       'PDF subido',
  EN_FLUJO:         'En flujo',
  FINALIZADO:       'Finalizado',
}
export function BadgeEstadoDoc({ estado }: { estado: EstadoDocumento }) {
  return <span className={`badge ${estadoDoc[estado]}`}>{estadoDocLabel[estado]}</span>
}

const estadoDer: Record<EstadoDerivacion, string> = {
  PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700',
  APROBADA:             'bg-blue-100 text-blue-700',
  RECHAZADA:            'bg-red-100 text-red-700',
  ENVIADA:              'bg-indigo-100 text-indigo-700',
  RECIBIDA:             'bg-green-100 text-green-700',
}
export function BadgeEstadoDer({ estado }: { estado: EstadoDerivacion }) {
  return <span className={`badge ${estadoDer[estado]}`}>{estado.replace('_', ' ')}</span>
}

const tipoBandeja: Record<TipoBandeja, string> = {
  ENTRANTE:             'bg-green-100 text-green-700',
  SALIENTE:             'bg-blue-100 text-blue-700',
  PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700',
}
export function BadgeTipoBandeja({ tipo }: { tipo: TipoBandeja }) {
  return <span className={`badge ${tipoBandeja[tipo]}`}>{tipo.replace('_', ' ')}</span>
}

// ─── Alert ────────────────────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success' | 'info'; message: string }) {
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {message}
    </div>
  )
}

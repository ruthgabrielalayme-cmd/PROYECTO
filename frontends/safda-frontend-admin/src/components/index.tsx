import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { EstadoDocumento, EstadoDerivacion } from '../types'

// ─── Sidebar Layout ───────────────────────────────────────────────────────
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()

  const navItems = [
    { to: '/dashboard',      icon: '⊞', label: 'Dashboard' },
    { to: '/usuarios',       icon: '👥', label: 'Usuarios' },
    { to: '/tipos-documento',icon: '📋', label: 'Tipos de Documento' },
    { to: '/documentos',     icon: '📄', label: 'Documentos' },
    { to: '/hojas-ruta',     icon: '📂', label: 'Hojas de Ruta' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-100 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 shadow">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-slate-900">SAFDA</p>
            <p className="text-xs text-primary-600 font-semibold">Panel Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${loc.pathname.startsWith(item.to) ? 'active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {(perfil?.nombre_completo ?? perfil?.correo ?? 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {perfil?.nombre_completo ?? perfil?.correo ?? 'Admin'}
              </p>
              <p className="text-xs text-slate-500">{perfil?.rol}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Cerrar sesión"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 bg-surface">
        {children}
      </main>
    </div>
  )
}

// ─── Page Shell ───────────────────────────────────────────────────────────
export function PageShell({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
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

// ─── Stat Card ────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: string; color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className={`mt-1 font-display text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
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
export function EmptyState({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-5xl">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success' | 'info'; message: string }) {
  const s = { error: 'bg-red-50 border-red-200 text-red-700', success: 'bg-green-50 border-green-200 text-green-700', info: 'bg-blue-50 border-blue-200 text-blue-700' }
  return <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${s[type]}`}>{message}</div>
}

// ─── Badges ───────────────────────────────────────────────────────────────
const estadoDoc: Record<EstadoDocumento, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  PDF_SUBIDO: 'bg-blue-100 text-blue-700', EN_FLUJO: 'bg-green-100 text-green-700', FINALIZADO: 'bg-slate-200 text-slate-800'
}
const estadoDocLabel: Record<EstadoDocumento, string> = {
  BORRADOR: 'Borrador', PDF_SUBIDO: 'PDF subido', EN_FLUJO: 'En flujo', FINALIZADO: 'Finalizado'
}
export function BadgeEstadoDoc({ estado }: { estado: EstadoDocumento }) {
  return <span className={`badge ${estadoDoc[estado]}`}>{estadoDocLabel[estado]}</span>
}

const rolColors: Record<string, string> = {
  ADMIN: 'bg-primary-100 text-primary-700',
  ENCARGADO: 'bg-blue-100 text-blue-700',
  FUNCIONARIO: 'bg-slate-100 text-slate-600',
}
export function BadgeRol({ rol }: { rol: string }) {
  return <span className={`badge ${rolColors[rol] ?? 'bg-slate-100 text-slate-600'}`}>{rol}</span>
}

const estadoUsuario: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  PENDIENTE_ASIGNACION: 'bg-amber-100 text-amber-700',
  INACTIVO: 'bg-red-100 text-red-600',
}
export function BadgeEstadoUsuario({ estado }: { estado: string }) {
  return <span className={`badge ${estadoUsuario[estado] ?? 'bg-slate-100 text-slate-600'}`}>{estado.replace('_', ' ')}</span>
}

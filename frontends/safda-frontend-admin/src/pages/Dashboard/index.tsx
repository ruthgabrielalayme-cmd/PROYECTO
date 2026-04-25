import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usuariosService } from '../../api/usuariosService'
import { documentosService } from '../../api/documentosService'
import { plataformaService } from '../../api/plataformaService'
import { AdminLayout, PageShell, StatCard, Spinner, BadgeEstadoDoc } from '../../components'
import type { Usuario, Documento, HojaRuta } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
  const [usuarios,   setUsuarios]   = useState<Usuario[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [hojas,      setHojas]      = useState<HojaRuta[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      usuariosService.getAll(),
      documentosService.getAll(),
      plataformaService.getHojasRuta(),
    ]).then(([u, d, h]) => {
      setUsuarios(u)
      setDocumentos(d)
      setHojas(h)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      </AdminLayout>
    )
  }

  const pendientes = usuarios.filter((u) => u.estado === 'PENDIENTE_ASIGNACION').length
  const enFlujo    = documentos.filter((d) => d.estado === 'EN_FLUJO').length
  const abiertas   = hojas.filter((h) => h.estado === 'ABIERTA').length

  return (
    <AdminLayout>
      <PageShell title="Dashboard" subtitle={`Resumen del sistema · ${format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}`}>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Usuarios"       value={usuarios.length}   icon="👥" color="text-primary-700" />
          <StatCard label="Usuarios Pendientes"  value={pendientes}        icon="⏳" color="text-amber-600"   />
          <StatCard label="Documentos en Flujo"  value={enFlujo}           icon="📄" color="text-blue-600"    />
          <StatCard label="Hojas Ruta Abiertas"  value={abiertas}          icon="📂" color="text-accent-600"  />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Usuarios pendientes */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-slate-800">Usuarios Pendientes de Asignación</h2>
              <Link to="/usuarios" className="text-xs font-semibold text-primary-600 hover:text-primary-800">Ver todos →</Link>
            </div>
            {pendientes === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Sin usuarios pendientes</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {usuarios.filter((u) => u.estado === 'PENDIENTE_ASIGNACION').slice(0, 5).map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.nombre_completo ?? u.correo ?? 'Sin nombre'}</p>
                      <p className="text-xs text-slate-500">{u.provider} · {u.correo ?? '—'}</p>
                    </div>
                    <Link to={`/usuarios/${u.id}`} className="btn-secondary py-1 text-xs">Asignar</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documentos recientes */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-slate-800">Documentos Recientes</h2>
              <Link to="/documentos" className="text-xs font-semibold text-primary-600 hover:text-primary-800">Ver todos →</Link>
            </div>
            {documentos.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Sin documentos</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {documentos.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{d.tipo_documento.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {d.site_generado ?? 'Sin CITE'} · {format(new Date(d.created_at), 'dd MMM', { locale: es })}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0">
                      <BadgeEstadoDoc estado={d.estado} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageShell>
    </AdminLayout>
  )
}

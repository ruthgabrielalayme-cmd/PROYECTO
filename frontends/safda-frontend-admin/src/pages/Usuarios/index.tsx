import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usuariosService } from '../../api/usuariosService'
import { AdminLayout, PageShell, Spinner, EmptyState, BadgeRol, BadgeEstadoUsuario } from '../../components'
import type { Usuario } from '../../types'

export default function UsuariosPage() {
  const [usuarios, setUsuarios]   = useState<Usuario[]>([])
  const [loading,  setLoading]    = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [filtroEstado, setFiltro] = useState('')

  useEffect(() => {
    usuariosService.getAll()
      .then(setUsuarios)
      .finally(() => setLoading(false))
  }, [])

  const filtrados = usuarios.filter((u) => {
    const texto = busqueda.toLowerCase()
    const matchTexto = !texto ||
      u.nombre_completo?.toLowerCase().includes(texto) ||
      u.correo?.toLowerCase().includes(texto) ||
      u.area?.toLowerCase().includes(texto)
    const matchEstado = !filtroEstado || u.estado === filtroEstado
    return matchTexto && matchEstado
  })

  return (
    <AdminLayout>
      <PageShell
        title="Usuarios"
        subtitle={`${usuarios.length} usuarios registrados en el sistema`}
      >
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input max-w-xs"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltro(e.target.value)}
            className="input w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="PENDIENTE_ASIGNACION">Pendiente asignación</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {!loading && filtrados.length === 0 && (
          <EmptyState icon="👥" title="Sin usuarios" description="No se encontraron usuarios con esos filtros." />
        )}

        {!loading && filtrados.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {['Nombre', 'Correo', 'Área', 'Rol', 'Estado', 'Proveedor', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.nombre_completo ?? <span className="text-slate-400 italic">Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.correo ?? '—'}</td>
                    <td className="px-4 py-3">
                      {u.area
                        ? <span className="font-mono text-xs font-semibold text-slate-700">{u.area}</span>
                        : <span className="text-amber-600 text-xs font-medium">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3"><BadgeRol rol={u.rol} /></td>
                    <td className="px-4 py-3"><BadgeEstadoUsuario estado={u.estado} /></td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {u.provider === 'GOOGLE' ? '🔵 Google' : '🇧🇴 CD'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/usuarios/${u.id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </AdminLayout>
  )
}

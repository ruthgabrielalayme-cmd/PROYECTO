import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import {
  AdminLayout, PageShell, Spinner, EmptyState, BadgeEstadoDoc,
} from '../../components'
import type { Documento, EstadoDocumento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading,    setLoading]    = useState(true)
  const [busqueda,   setBusqueda]   = useState('')
  const [filtroEstado, setFiltro]   = useState<EstadoDocumento | ''>('')

  useEffect(() => {
    documentosService.getAll()
      .then(setDocumentos)
      .finally(() => setLoading(false))
  }, [])

  const filtrados = documentos.filter((d) => {
    const texto = busqueda.toLowerCase()
    const matchTexto = !texto ||
      d.tipo_documento.nombre.toLowerCase().includes(texto) ||
      d.site_generado?.toLowerCase().includes(texto) ||
      d.nombre_archivo.toLowerCase().includes(texto)
    const matchEstado = !filtroEstado || d.estado === filtroEstado
    return matchTexto && matchEstado
  })

  const ESTADOS: EstadoDocumento[] = ['BORRADOR', 'PDF_SUBIDO', 'EN_FLUJO', 'FINALIZADO']

  return (
    <AdminLayout>
      <PageShell
        title="Documentos"
        subtitle={`${documentos.length} documentos en el sistema`}
      >
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por tipo, CITE o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input max-w-xs"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltro(e.target.value as EstadoDocumento | '')}
            className="input w-auto"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {!loading && filtrados.length === 0 && (
          <EmptyState icon="📄" title="Sin documentos" description="No se encontraron documentos con esos filtros." />
        )}

        {!loading && filtrados.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {['Tipo', 'CITE / Nombre', 'Estado', 'QR', 'Hoja de Ruta', 'Creado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {d.tipo_documento.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.site_generado
                        ? <span className="font-mono font-bold text-primary-700">{d.site_generado}</span>
                        : <span className="truncate text-xs text-slate-400">{d.nombre_archivo.slice(0, 30)}...</span>}
                    </td>
                    <td className="px-4 py-3"><BadgeEstadoDoc estado={d.estado} /></td>
                    <td className="px-4 py-3">
                      {d.qr_id
                        ? <span className="text-green-600 text-xs font-semibold">✓ Generado</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.hoja_ruta_id
                        ? <Link to={`/hojas-ruta/${d.hoja_ruta_id}`} className="font-mono text-xs text-primary-600 hover:underline">
                            Ver hoja →
                          </Link>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(d.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/documentos/${d.id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                      >
                        Ver →
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

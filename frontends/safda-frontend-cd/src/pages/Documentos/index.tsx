import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import { AdminLayout, PageShell, Spinner, EmptyState, BadgeEstadoDoc } from '../../components'
import type { Documento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ListaDocumentos() {
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    documentosService.getAll()
      .then(setDocs)
      .catch(() => setError('No se pudieron cargar los documentos'))
      .finally(() => setLoading(false))
  }, [])

  return (

<AdminLayout>

      <PageShell
        title="Mis Documentos"
        subtitle="Documentos de tu área / creados por vos"
        action={
          <Link to="/documentos/nuevo" className="btn-primary text-sm">
            + Nuevo Documento
          </Link>
        }
      >
        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!loading && !error && docs.length === 0 && (
          <EmptyState icon="📄" title="Sin documentos" description="No hay documentos disponibles." />
        )}
        {!loading && docs.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Archivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Área</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{doc.id.split('-')[0]}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{doc.nombre_archivo}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.area}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstadoDoc estado={doc.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/documentos/${doc.id}`} className="text-xs font-semibold text-primary-600 hover:text-primary-800">
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

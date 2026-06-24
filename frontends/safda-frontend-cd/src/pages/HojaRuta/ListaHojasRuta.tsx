import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { plataformaService } from '../../api/plataformaService'
import { AdminLayout, PageShell, Spinner, EmptyState } from '../../components'
import type { HojaRuta } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ListaHojasRuta() {
  const [hojas, setHojas] = useState<HojaRuta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    plataformaService.getHojasRuta()
      .then(setHojas)
      .catch(() => setError('No se pudieron cargar las hojas de ruta'))
      .finally(() => setLoading(false))
  }, [])

  return (

<AdminLayout>

      <PageShell title="Hojas de Ruta" subtitle="Listado de hojas de ruta de tu área">
        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!loading && !error && hojas.length === 0 && (
          <EmptyState icon="🛤️" title="Sin hojas de ruta" description="No hay hojas de ruta disponibles." />
        )}
        {!loading && hojas.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Área Origen</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha Creada</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hojas.map((h) => (
                  <tr key={h.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-700">{h.codigo}</td>
                    <td className="px-4 py-3 text-slate-600">{h.area_origen}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-slate-100 text-slate-700">{h.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(new Date(h.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/hoja-ruta/${h.id}`} className="text-xs font-semibold text-primary-600 hover:text-primary-800">
                        Ver Detalle →
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

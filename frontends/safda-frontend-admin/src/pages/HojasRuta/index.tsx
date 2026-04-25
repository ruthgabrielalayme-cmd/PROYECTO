import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { plataformaService } from '../../api/plataformaService'
import { AdminLayout, PageShell, Spinner, EmptyState } from '../../components'
import type { HojaRuta, EstadoHojaRuta } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const estadoColor: Record<EstadoHojaRuta, string> = {
  ABIERTA:   'bg-green-100 text-green-700',
  EN_PROCESO:'bg-blue-100 text-blue-700',
  CERRADA:   'bg-slate-100 text-slate-600',
  ARCHIVADA: 'bg-slate-100 text-slate-400',
}

export default function HojasRutaPage() {
  const [hojas,    setHojas]    = useState<HojaRuta[]>([])
  const [loading,  setLoading]  = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltro] = useState<EstadoHojaRuta | ''>('')

  useEffect(() => {
    plataformaService.getHojasRuta()
      .then(setHojas)
      .finally(() => setLoading(false))
  }, [])

  const filtradas = hojas.filter((h) => {
    const texto = busqueda.toLowerCase()
    const matchTexto = !texto ||
      h.codigo.toLowerCase().includes(texto) ||
      h.area_origen.toLowerCase().includes(texto)
    const matchEstado = !filtroEstado || h.estado === filtroEstado
    return matchTexto && matchEstado
  })

  return (
    <AdminLayout>
      <PageShell
        title="Hojas de Ruta"
        subtitle={`${hojas.length} hojas de ruta en el sistema`}
      >
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por código o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input max-w-xs"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltro(e.target.value as EstadoHojaRuta | '')}
            className="input w-auto"
          >
            <option value="">Todos los estados</option>
            {(['ABIERTA', 'EN_PROCESO', 'CERRADA', 'ARCHIVADA'] as EstadoHojaRuta[]).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {!loading && filtradas.length === 0 && (
          <EmptyState icon="📂" title="Sin hojas de ruta" description="No se encontraron hojas de ruta con esos filtros." />
        )}

        {!loading && filtradas.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {['Código', 'Área Origen', 'Estado', 'Derivaciones', 'Creado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((h) => (
                  <tr key={h.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-primary-700">{h.codigo}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{h.area_origen}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${estadoColor[h.estado]}`}>{h.estado.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {h.derivaciones?.length ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {format(new Date(h.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/hojas-ruta/${h.id}`}
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

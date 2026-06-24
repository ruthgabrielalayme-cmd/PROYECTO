import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { plataformaService } from '../../api/plataformaService'
import { AdminLayout, PageShell, Spinner, EmptyState, BadgeTipoBandeja } from '../../components'
import type { Bandeja } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function BandejaEntrada() {
  const { perfil } = useAuth()
  const [items,   setItems]   = useState<Bandeja[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!perfil?.id) return
    plataformaService.getBandeja(perfil.id, 'ENTRANTE')
      .then(setItems)
      .catch(() => setError('No se pudo cargar la bandeja de entrada'))
      .finally(() => setLoading(false))
  }, [perfil?.id])

  return (
    <AdminLayout>
      <PageShell
        title="Bandeja de Entrada"
        subtitle="Documentos recibidos y pendientes de revisión"
      >
        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <EmptyState icon="📥" title="Bandeja vacía" description="No tenés documentos recibidos por el momento." />
        )}
        {!loading && items.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {['Hoja de Ruta', 'Área Origen', 'Tipo', 'Fecha', 'Leído', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((b) => (
                  <tr key={b.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-700">{b.hoja_ruta.codigo}</td>
                    <td className="px-4 py-3 text-slate-600">{b.hoja_ruta.area_origen}</td>
                    <td className="px-4 py-3"><BadgeTipoBandeja tipo={b.tipo} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(b.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${b.leido ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.leido ? 'Leído' : 'Nuevo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link to={`/hojas-ruta/${b.hoja_ruta.id}`} className="text-xs font-semibold text-primary-600 hover:text-primary-800">
                          Ver hoja →
                        </Link>
                        {b.tipo === 'ENTRANTE' && (
                          <button
                            onClick={async () => {
                              // Suponemos que podemos buscar la derivación a recibir en base a la hoja de ruta en este context.
                              // Nota: La forma más limpia sería que el backend devolviera el id de derivación en la bandeja,
                              // pero por simplicidad de UI, si un usuario necesita recibir, debe hacerlo desde el detalle de la hoja de ruta
                              // o derivación.
                            }}
                            className="hidden"
                          />
                        )}
                      </div>
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

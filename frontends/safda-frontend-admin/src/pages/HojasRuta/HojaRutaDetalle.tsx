import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { plataformaService } from '../../api/plataformaService'
import { AdminLayout, PageShell, Spinner, Alert } from '../../components'
import type { HojaRuta, EstadoHojaRuta, Derivacion } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const estadoColor: Record<EstadoHojaRuta, string> = {
  ABIERTA:   'bg-green-100 text-green-700',
  EN_PROCESO:'bg-blue-100 text-blue-700',
  CERRADA:   'bg-slate-100 text-slate-600',
  ARCHIVADA: 'bg-slate-100 text-slate-400',
}

const derivacionColor: Record<string, string> = {
  PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700',
  APROBADA:             'bg-blue-100 text-blue-700',
  RECHAZADA:            'bg-red-100 text-red-700',
  ENVIADA:              'bg-indigo-100 text-indigo-700',
  RECIBIDA:             'bg-green-100 text-green-700',
}

export default function HojaRutaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [hr,      setHr]      = useState<HojaRuta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    plataformaService.getHojaRuta(id)
      .then(setHr)
      .catch(() => setError('Hoja de ruta no encontrada'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <AdminLayout><div className="flex justify-center py-24"><Spinner size="lg" /></div></AdminLayout>
  if (error || !hr) return (
    <AdminLayout>
      <PageShell title="Error">
        <Alert type="error" message={error ?? 'No encontrada'} />
      </PageShell>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <PageShell
        title={`HR: ${hr.codigo}`}
        subtitle={`Área ${hr.area_origen} · Creada el ${format(new Date(hr.created_at), "dd 'de' MMMM yyyy", { locale: es })}`}
        action={
          <button onClick={() => navigate('/hojas-ruta')} className="btn-secondary">← Volver</button>
        }
      >
        {/* Estado general */}
        <div className="mb-6 flex flex-wrap gap-3">
          <span className={`badge text-sm ${estadoColor[hr.estado]}`}>{hr.estado.replace('_', ' ')}</span>
          <span className="badge bg-slate-100 text-slate-600 text-sm">
            {hr.derivaciones?.length ?? 0} derivaciones
          </span>
        </div>

        {/* Info */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Código',      value: <span className="font-mono font-bold text-primary-700">{hr.codigo}</span> },
            { label: 'Área Origen', value: hr.area_origen },
            { label: 'Creado por',  value: <span className="font-mono text-xs">{hr.creado_por.slice(0, 8)}...</span> },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Timeline de derivaciones */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-800">
              Historial de Derivaciones
            </h2>
          </div>

          {!hr.derivaciones || hr.derivaciones.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">Sin derivaciones registradas en esta hoja de ruta</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {hr.derivaciones.map((d: Derivacion, i: number) => (
                <div key={d.id} className="flex items-start gap-4 px-6 py-5">
                  {/* Número */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {i + 1}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`badge ${derivacionColor[d.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {d.estado.replace(/_/g, ' ')}
                      </span>
                      <span className={`badge text-xs ${d.es_externa ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                        {d.es_externa ? 'Externa' : 'Interna'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(d.created_at), 'dd MMM yyyy · HH:mm', { locale: es })}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="font-medium text-slate-700">De:</span>{' '}
                        <span className="font-mono">{d.remitente_id.slice(0, 8)}...</span>
                      </span>
                      <span>
                        <span className="font-medium text-slate-700">Para:</span>{' '}
                        <span className="font-mono">{d.destinatario_id.slice(0, 8)}...</span>
                      </span>
                    </div>

                    {d.nota && (
                      <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 italic">
                        "{d.nota}"
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <Link
                    to={`/documentos/${d.documento_id}`}
                    className="shrink-0 text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    Ver doc →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </AdminLayout>
  )
}

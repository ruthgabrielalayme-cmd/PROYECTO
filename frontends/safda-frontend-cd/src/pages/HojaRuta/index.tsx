import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { plataformaService } from '../../api/plataformaService'
import { Navbar, PageShell, Spinner, BadgeEstadoDer, Alert } from '../../components'
import type { HojaRuta } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function HojaRutaPage() {
  const { id } = useParams<{ id: string }>()
  const [hr, setHr]           = useState<HojaRuta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    plataformaService.getHojaRuta(id)
      .then(setHr)
      .catch(() => setError('No se encontró la hoja de ruta'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <><Navbar /><div className="flex justify-center py-24"><Spinner size="lg" /></div></>
  if (error || !hr) return <><Navbar /><PageShell title="Error"><Alert type="error" message={error ?? 'No encontrada'} /></PageShell></>

  const estadoColor: Record<string, string> = {
    ABIERTA:   'bg-green-100 text-green-700',
    EN_PROCESO:'bg-blue-100 text-blue-700',
    CERRADA:   'bg-slate-100 text-slate-600',
    ARCHIVADA: 'bg-slate-100 text-slate-500',
  }

  return (
    <>
      <Navbar />
      <PageShell
        title={`Hoja de Ruta: ${hr.codigo}`}
        subtitle={`Área: ${hr.area_origen} · Creada el ${format(new Date(hr.created_at), "dd 'de' MMMM yyyy", { locale: es })}`}
      >
        {/* Estado */}
        <div className="mb-6 flex items-center gap-3">
          <span className={`badge text-sm ${estadoColor[hr.estado] ?? 'bg-slate-100 text-slate-600'}`}>
            {hr.estado}
          </span>
        </div>

        {/* Derivaciones */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-800">
              Historial de Derivaciones
            </h2>
          </div>

          {!hr.derivaciones || hr.derivaciones.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Sin derivaciones registradas
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {hr.derivaciones.map((d, i) => (
                <div key={d.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <BadgeEstadoDer estado={d.estado} />
                      <span className="text-xs text-slate-500">
                        {d.es_externa ? '🔄 Externa' : '↩ Interna'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(d.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                    {d.nota && (
                      <p className="mt-1 text-sm text-slate-600">"{d.nota}"</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-500">
                      De: <span className="font-medium text-slate-700">{d.remitente_nombre || 'Usuario desconocido'}</span> &nbsp;|&nbsp;
                      Para: <span className="font-medium text-slate-700">{d.destinatario_nombre || 'Usuario desconocido'}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500 mb-1">
                      Documento: <span className="font-medium text-slate-700">{d.documento_nombre || 'Documento desconocido'}</span>
                    </p>
                    <Link
                      to={`/documentos/${d.documento_id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                    >
                      Ver doc →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </>
  )
}

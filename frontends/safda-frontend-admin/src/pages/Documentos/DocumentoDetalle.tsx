import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import { AdminLayout, PageShell, Spinner, BadgeEstadoDoc, Alert } from '../../components'
import type { Documento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DocumentoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc,     setDoc]     = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    documentosService.getById(id)
      .then(setDoc)
      .catch(() => setError('Documento no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <AdminLayout><div className="flex justify-center py-24"><Spinner size="lg" /></div></AdminLayout>
  if (error || !doc) return (
    <AdminLayout>
      <PageShell title="Error">
        <Alert type="error" message={error ?? 'Documento no encontrado'} />
      </PageShell>
    </AdminLayout>
  )

  const handleVerPdf = async () => {
    if (!id) return
    try {
      const blob = await documentosService.verPdf(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      alert('Error al visualizar el PDF')
    }
  }

  return (
    <AdminLayout>
      <PageShell
        title="Detalle del Documento"
        subtitle={doc.nombre_archivo}
        action={
          <div className="flex gap-2">
            {(doc.estado === 'PDF_SUBIDO' || doc.estado === 'EN_FLUJO' || doc.estado as string === 'FINALIZADO') && (
              <button onClick={handleVerPdf} className="btn-secondary">
                Ver PDF
              </button>
            )}
            {doc.estado !== 'EN_FLUJO' && (
              <Link to={`/documentos/${id}/subir-pdf`} className="btn-primary">
                Subir PDF
              </Link>
            )}
            {doc.estado === 'PDF_SUBIDO' && (
              <Link to={`/derivar/${id}`} className="btn-secondary">
                Derivar
              </Link>
            )}
            <button onClick={() => navigate('/documentos')} className="btn-secondary">
              ← Volver
            </button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Info */}
          <div className="card space-y-4 p-6">
            <h2 className="font-display text-sm font-semibold text-slate-800">Información</h2>
            <dl className="space-y-3 text-sm">
              {[
                ['Estado',     <BadgeEstadoDoc estado={doc.estado} />],
                ['Tipo',       <span className="font-semibold">{doc.tipo_documento.nombre}</span>],
                ['CITE',       doc.site_generado
                  ? <span className="font-mono font-bold text-primary-700">{doc.site_generado}</span>
                  : <span className="text-slate-400 italic">No generado</span>],
                ['Creado por', <span className="text-sm font-medium">{doc.creado_por_nombre || 'Usuario desconocido'}</span>],
                ['Creado el',  format(new Date(doc.created_at), "dd 'de' MMMM yyyy HH:mm", { locale: es })],
                ['Actualizado', format(new Date(doc.updated_at), "dd 'de' MMMM yyyy HH:mm", { locale: es })],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-slate-800">{v as React.ReactNode}</dd>
                </div>
              ))}
            </dl>
            {doc.hoja_ruta_id && (
              <Link
                to={`/hojas-ruta/${doc.hoja_ruta_id}`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
              >
                Ver hoja de ruta →
              </Link>
            )}
          </div>

          {/* QR */}
          <div className="card flex flex-col items-center justify-center gap-4 p-6">
            {doc.qr_id ? (
              <>
                <h2 className="font-display text-sm font-semibold text-slate-800">Código QR de Trazabilidad</h2>
                <div className="rounded-2xl border-2 border-primary-100 p-3 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://safda.gob.bo/consulta/${doc.qr_id}`)}`}
                    alt="QR del documento"
                    className="h-44 w-44"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">ID del QR:</p>
                  <p className="font-mono text-xs font-semibold text-primary-700">{doc.qr_id}</p>
                </div>
                <Link
                  to={`/trazabilidad/${doc.qr_id}`}
                  className="btn-secondary text-xs"
                >
                  Ver trazabilidad pública
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-4xl text-slate-200">□</span>
                <p className="text-sm text-slate-500">QR no generado</p>
                <p className="text-xs text-slate-400">Se genera al subir el PDF definitivo</p>
                {doc.estado !== 'EN_FLUJO' && (
                  <Link to={`/documentos/${id}/subir-pdf`} className="btn-primary mt-2 text-xs">
                    Subir PDF ahora
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </AdminLayout>
  )
}

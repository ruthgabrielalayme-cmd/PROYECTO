import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import { Navbar, PageShell, Spinner, BadgeEstadoDoc, Alert } from '../../components'
import type { Documento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DetalleDocumento() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc]         = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    documentosService.getById(id)
      .then(setDoc)
      .catch(() => setError('No se encontró el documento'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <><Navbar /><div className="flex justify-center py-24"><Spinner size="lg" /></div></>
  if (error || !doc) return <><Navbar /><PageShell title="Error"><Alert type="error" message={error ?? 'Documento no encontrado'} /></PageShell></>

  return (
    <>
      <Navbar />
      <PageShell
        title={doc.nombre_archivo}
        subtitle={`Creado el ${format(new Date(doc.created_at), "dd 'de' MMMM yyyy", { locale: es })}`}
        action={
          <div className="flex gap-2">
            {doc.estado !== 'EN_FLUJO' && doc.estado !== 'FINALIZADO' && doc.estado !== 'PDF_SUBIDO' && (
              <Link to={`/documentos/${id}/subir-pdf`} className="btn-primary">
                Subir PDF
              </Link>
            )}
            {doc.estado === 'PDF_SUBIDO' && (
              <Link to={`/derivar/${id}`} className="btn-secondary">
                Derivar
              </Link>
            )}
            {(doc.estado === 'PDF_SUBIDO' || doc.estado === 'EN_FLUJO' || doc.estado === 'FINALIZADO') && (
              <button
                onClick={async () => {
                  try {
                    const blob = await documentosService.descargarPdf(id!)
                    const url  = URL.createObjectURL(blob)
                    const a    = document.createElement('a')
                    a.href     = url
                    a.download = `${doc.site_generado ? doc.site_generado.replace(/\//g, '-') : 'Documento'}.pdf`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {
                    alert('Error al descargar el PDF')
                  }
                }}
                className="btn-primary bg-indigo-600 hover:bg-indigo-700"
              >
                Ver PDF
              </button>
            )}
          </div>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Info principal */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-800">Información del Documento</h2>
            <div className="space-y-3 text-sm">
              <Row label="Estado"><BadgeEstadoDoc estado={doc.estado} /></Row>
              <Row label="Tipo">{doc.tipo_documento.nombre}</Row>
              <Row label="Creado por">{doc.creado_por}</Row>
              {doc.site_generado && (
                <Row label="CITE">
                  <span className="font-mono font-bold text-primary-700">{doc.site_generado}</span>
                </Row>
              )}
              {doc.hoja_ruta_id && (
                <Row label="Hoja de Ruta">
                  <Link to={`/hoja-ruta/${doc.hoja_ruta_id}`} className="text-primary-600 hover:underline">
                    Ver hoja →
                  </Link>
                </Row>
              )}
              <Row label="Última actualización">
                {format(new Date(doc.updated_at), 'dd MMM yyyy HH:mm', { locale: es })}
              </Row>
            </div>
          </div>

          {/* QR */}
          {doc.qr_id && (
            <div className="card flex flex-col items-center justify-center gap-4 p-6">
              <h2 className="font-display text-base font-semibold text-slate-800">Código QR</h2>
              <div className="rounded-xl border-2 border-primary-100 p-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://safda.gob.bo/consulta/${doc.qr_id}`)}`}
                  alt="QR del documento"
                  className="h-36 w-36"
                />
              </div>
              <p className="text-center text-xs text-slate-500">
                URL de verificación:<br />
                <span className="font-mono text-primary-600">safda.gob.bo/consulta/{doc.qr_id.slice(0, 8)}...</span>
              </p>
            </div>
          )}
        </div>
      </PageShell>
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{children}</span>
    </div>
  )
}

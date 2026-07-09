import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import { Navbar, PageShell, Spinner, BadgeEstadoDoc, Alert } from '../../components'
import type { Documento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'

export default function DetalleDocumento() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc]         = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const { perfil } = useAuth()

  const [isUploading, setIsUploading] = useState(false)
  const [evalModal, setEvalModal] = useState<{ show: boolean, obs: string }>({ show: false, obs: '' })

  const loadDoc = () => {
    if (!id) return
    documentosService.getById(id)
      .then(setDoc)
      .catch(() => setError('No se encontró el documento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDoc()
  }, [id])

  const handleSubirWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
        alert('Solo se admiten archivos Word (.doc, .docx)')
        return
    }
    setIsUploading(true)
    try {
        await documentosService.subirWord(id, file)
        loadDoc()
    } catch (err) {
        alert('Error al subir archivo Word')
    } finally {
        setIsUploading(false)
        e.target.value = ''
    }
  }

  const handleEvaluar = async (accion: 'APROBAR' | 'RECHAZAR', obs?: string) => {
    if (!id) return
    try {
        await documentosService.evaluar(id, accion, obs)
        setEvalModal({ show: false, obs: '' })
        loadDoc()
    } catch (err) {
        alert('Error al evaluar el borrador')
    }
  }

  if (loading) return <><Navbar /><div className="flex justify-center py-24"><Spinner size="lg" /></div></>
  if (error || !doc) return <><Navbar /><PageShell title="Error"><Alert type="error" message={error ?? 'Documento no encontrado'} /></PageShell></>

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
    <>
      <Navbar />
      <PageShell
        title={doc.nombre_archivo}
        subtitle={`Creado el ${format(new Date(doc.created_at), "dd 'de' MMMM yyyy", { locale: es })}`}
        action={
          <div className="flex gap-2">
            {(doc.estado === 'PDF_SUBIDO' || doc.estado === 'EN_FLUJO' || doc.estado as string === 'FINALIZADO') && (
              <button onClick={handleVerPdf} className="btn-secondary">
                Ver PDF
              </button>
            )}
            {doc.estado === 'BORRADOR_APROBADO' && (
              <Link to={`/documentos/${id}/subir-pdf`} className="btn-primary">
                Subir PDF Final
              </Link>
            )}
            {doc.estado === 'PDF_SUBIDO' && (
              <Link to={`/derivar/${id}`} className="btn-secondary">
                Derivar
              </Link>
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
              <Row label="Creado por">{doc.creado_por_nombre || 'Usuario desconocido'}</Row>
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

            {/* FASE DE REVISIÓN Y BORRADOR */}
            {doc.estado === 'BORRADOR' && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-display text-sm font-semibold text-slate-800 mb-3">Fase de Revisión</h3>

                {doc.observaciones_rechazo && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    <p className="font-semibold">Rechazado. Observaciones:</p>
                    <p className="mt-1">{doc.observaciones_rechazo}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Archivo de Word actual:</p>
                    {doc.archivo_word_path ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        📄 Documento cargado
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Ningún archivo subido</span>
                    )}
                  </div>

                  {perfil?.id === doc.creado_por && (
                    <div className="flex flex-col gap-2">
                      <label className="btn-secondary flex cursor-pointer items-center justify-center relative">
                        {isUploading ? 'Subiendo...' : 'Subir o reemplazar Word (.docx)'}
                        <input
                          type="file"
                          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                          onChange={handleSubirWord}
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-xs text-slate-400 text-center">
                        Solo puedes subir un archivo .doc o .docx para revisión.
                      </p>
                    </div>
                  )}

                  {perfil?.rol === 'ENCARGADO' && doc.archivo_word_path && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEvaluar('APROBAR')}
                        className="btn-primary flex-1 bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
                      >
                        Aprobar Redacción
                      </button>
                      <button
                        onClick={() => setEvalModal({ show: true, obs: '' })}
                        className="btn-secondary flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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

      {/* Modal Rechazo */}
      {evalModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-display text-lg font-bold text-slate-800">Rechazar Borrador</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
                <textarea
                  className="input-field border rounded w-full p-2"
                  rows={4}
                  value={evalModal.obs}
                  onChange={(e) => setEvalModal({ ...evalModal, obs: e.target.value })}
                  placeholder="Indica qué debe corregirse..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEvaluar('RECHAZAR', evalModal.obs)}
                  disabled={!evalModal.obs.trim()}
                  className="btn-primary flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50"
                >
                  Confirmar Rechazo
                </button>
                <button
                  onClick={() => setEvalModal({ show: false, obs: '' })}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

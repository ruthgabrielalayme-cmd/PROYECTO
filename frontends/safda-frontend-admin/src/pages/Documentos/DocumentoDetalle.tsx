import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import { AdminLayout, PageShell, Spinner, BadgeEstadoDoc, Alert } from '../../components'
import type { Documento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'

export default function DocumentoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc,     setDoc]     = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const { perfil } = useAuth()

  const [isUploading, setIsUploading] = useState(false)
  const [evalModal, setEvalModal] = useState<{ show: boolean, obs: string }>({ show: false, obs: '' })

  const loadDoc = () => {
    if (!id) return
    documentosService.getById(id)
      .then(setDoc)
      .catch(() => setError('Documento no encontrado'))
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

  const handleDescargarWord = async () => {
    if (!id) return
    try {
      const blob = await documentosService.descargarWord(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      alert('Error al descargar el archivo Word')
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
                      <button
                        onClick={handleDescargarWord}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer border border-blue-200"
                      >
                        📄 Ver documento Word
                      </button>
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

      {/* Modal Rechazo */}
      {evalModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-display text-lg font-bold text-slate-800">Rechazar Borrador</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
                <textarea
                  className="input-field"
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
    </AdminLayout>
  )
}

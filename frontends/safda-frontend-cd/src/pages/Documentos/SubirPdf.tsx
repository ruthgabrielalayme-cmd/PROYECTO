import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import { Navbar, PageShell, Spinner, Alert } from '../../components'
import type { Documento } from '../../types'

export default function SubirPdf() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [doc, setDoc]           = useState<Documento | null>(null)
  const [file, setFile]         = useState<File | null>(null)
  const [site, setSite]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    if (!id) return
    documentosService.getById(id).then(setDoc).catch(() => setError('Documento no encontrado'))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !site.trim() || !id) return
    setSubmitting(true)
    setError(null)
    try {
      await documentosService.subirPdf(id, file, site)
      setSuccess(true)
      setTimeout(() => navigate(`/documentos/${id}`), 1500)
    } catch {
      setError('Error al subir el PDF. Verificá que el archivo sea válido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <PageShell title="Subir PDF Definitivo" subtitle={doc?.nombre_archivo}>
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="card space-y-6 p-6">
            {error   && <Alert type="error"   message={error} />}
            {success && <Alert type="success" message="PDF subido correctamente. Redirigiendo..." />}

            {/* CITE */}
            <div>
              <label className="label">CITE del Documento *</label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="Ej: DAF-0001/2026"
                required
                className="input font-mono"
              />
              <p className="mt-1 text-xs text-slate-400">
                Formato: SIGLA_AREA-NUMERAL/AÑO · Ej: DAF-0042/2026
              </p>
            </div>

            {/* Archivo */}
            <div>
              <label className="label">Archivo PDF *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition ${
                  file ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                }`}
              >
                {file ? (
                  <>
                    <span className="text-2xl">📄</span>
                    <span className="text-sm font-semibold text-primary-700">{file.name}</span>
                    <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl text-slate-300">☁</span>
                    <span className="text-sm font-medium text-slate-600">Hacé clic para seleccionar el PDF</span>
                    <span className="text-xs text-slate-400">Máximo 10 MB</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={!file || !site || submitting} className="btn-primary">
                {submitting ? <><Spinner size="sm" /> Subiendo...</> : 'Subir PDF'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      </PageShell>
    </>
  )
}

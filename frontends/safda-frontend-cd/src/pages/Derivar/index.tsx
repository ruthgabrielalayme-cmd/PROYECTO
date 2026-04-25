import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { documentosService } from '../../api/documentosService'
import { plataformaService } from '../../api/plataformaService'
import { usuariosService } from '../../api/usuariosService'
import { Navbar, PageShell, Spinner, Alert } from '../../components'
import type { Documento, Usuario, HojaRuta } from '../../types'

export default function DerivarDocumento() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = useAuth()
  const navigate = useNavigate()

  const [doc, setDoc]           = useState<Documento | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [hojas, setHojas]       = useState<HojaRuta[]>([])

  const [hojaId, setHojaId]             = useState('')
  const [destinatarioId, setDestinatario] = useState('')
  const [esExterna, setEsExterna]       = useState(false)
  const [nota, setNota]                 = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    if (!id || !perfil?.id) return
    documentosService.getById(id).then(setDoc)
    usuariosService.getAll().then(setUsuarios)
    plataformaService.getHojasRuta().then(setHojas)
  }, [id, perfil?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doc || !perfil?.id || !hojaId || !destinatarioId) return
    setSubmitting(true)
    setError(null)
    try {
      await plataformaService.derivar({
        hoja_ruta_id:   hojaId,
        documento_id:   doc.id,
        remitente_id:   perfil.id,
        destinatario_id: destinatarioId,
        es_externa:     esExterna,
        nota:           nota || undefined,
      })
      navigate('/bandeja-salida')
    } catch {
      setError('Error al derivar el documento.')
    } finally {
      setSubmitting(false)
    }
  }

  const destinatario = usuarios.find((u) => u.id === destinatarioId)
  const mismaArea = destinatario?.area === perfil?.area

  return (
    <>
      <Navbar />
      <PageShell title="Derivar Documento" subtitle={doc?.nombre_archivo}>
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="card space-y-6 p-6">
            {error && <Alert type="error" message={error} />}

            {/* Hoja de Ruta */}
            <div>
              <label className="label">Hoja de Ruta *</label>
              <select value={hojaId} onChange={(e) => setHojaId(e.target.value)} required className="input">
                <option value="">Seleccioná una hoja de ruta...</option>
                {hojas.map((h) => (
                  <option key={h.id} value={h.id}>{h.codigo} — {h.area_origen}</option>
                ))}
              </select>
            </div>

            {/* Destinatario */}
            <div>
              <label className="label">Destinatario *</label>
              <select value={destinatarioId} onChange={(e) => setDestinatario(e.target.value)} required className="input">
                <option value="">Seleccioná un destinatario...</option>
                {usuarios
                  .filter((u) => u.id !== perfil?.id && u.estado === 'ACTIVO')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_completo ?? u.correo ?? u.id} — {u.area ?? 'Sin área'} ({u.rol})
                    </option>
                  ))}
              </select>
              {destinatarioId && (
                <p className={`mt-1 text-xs font-semibold ${mismaArea ? 'text-green-600' : 'text-amber-600'}`}>
                  {mismaArea
                    ? '✓ Derivación interna — se enviará directamente'
                    : '⚠ Derivación externa — requiere aprobación del encargado'}
                </p>
              )}
            </div>

            {/* Tipo derivación */}
            <div>
              <label className="label">Tipo de Derivación</label>
              <div className="flex gap-4">
                {([false, true] as const).map((val) => (
                  <label key={String(val)} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={esExterna === val}
                      onChange={() => setEsExterna(val)}
                      className="text-primary-600"
                    />
                    <span className={esExterna === val ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                      {val ? 'Externa (otra área)' : 'Interna (misma área)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nota */}
            <div>
              <label className="label">Nota (opcional)</label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder="Instrucciones o comentarios para el destinatario..."
                className="input resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={!hojaId || !destinatarioId || submitting} className="btn-primary">
                {submitting ? <><Spinner size="sm" /> Derivando...</> : 'Derivar Documento'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      </PageShell>
    </>
  )
}

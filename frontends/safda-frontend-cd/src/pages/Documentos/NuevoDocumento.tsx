import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { documentosService } from '../../api/documentosService'
import { plataformaService } from '../../api/plataformaService'
import { AdminLayout, PageShell, Spinner, Alert } from '../../components'
import type { TipoDocumento, HojaRuta } from '../../types'

export default function NuevoDocumento() {
  const { perfil } = useAuth()
  const navigate = useNavigate()

  const [tipos, setTipos]           = useState<TipoDocumento[]>([])
  const [hojas, setHojas]           = useState<HojaRuta[]>([])
  const [tipoId, setTipoId]         = useState('')
  const [hojaId, setHojaId]         = useState('')
  const [crearHoja, setCrearHoja]   = useState(false)
  const [areaOrigen, setAreaOrigen] = useState(perfil?.area ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    documentosService.getTipos().then(setTipos)
    if (perfil?.id) plataformaService.getHojasRuta().then(setHojas)
  }, [perfil?.id])

  const handleDescargarPlantilla = async () => {
    if (!tipoId) return
    try {
      const blob = await documentosService.descargarPlantilla(tipoId)
      const tipo = tipos.find((t) => t.id === tipoId)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `PLANTILLA-${tipo?.nombre ?? 'documento'}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo descargar la plantilla.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!perfil?.id || !tipoId) return
    setSubmitting(true)
    setError(null)
    try {
      let finalHojaId = hojaId
      if (crearHoja) {
        const hr = await plataformaService.crearHojaRuta({ area_origen: areaOrigen, creado_por: perfil.id })
        finalHojaId = hr.id
      }
      const doc = await documentosService.create({
        tipo_documento_id: tipoId,
        hoja_ruta_id: finalHojaId || undefined,
        creado_por: perfil.id,
        area: perfil.area || areaOrigen,
      })
      navigate(`/documentos/${doc.id}`)
    } catch {
      setError('Error al crear el documento. Verificá los datos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (

<AdminLayout>

      <PageShell title="Nuevo Documento" subtitle="Completá los datos para crear un documento">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="card space-y-6 p-6">
            {error && <Alert type="error" message={error} />}

            {/* Tipo de documento */}
            <div>
              <label className="label">Tipo de Documento *</label>
              <select
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
                required
                className="input"
              >
                <option value="">Seleccioná un tipo...</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              {tipoId && (
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-800"
                >
                  ⬇ Descargar plantilla .docx
                </button>
              )}
            </div>

            {/* Hoja de Ruta */}
            <div>
              <label className="label">Hoja de Ruta</label>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="crearHoja"
                  checked={crearHoja}
                  onChange={(e) => setCrearHoja(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600"
                />
                <label htmlFor="crearHoja" className="text-sm text-slate-700">Crear nueva hoja de ruta</label>
              </div>

              {crearHoja ? (
                <div>
                  <label className="label">Área de Origen</label>
                  <input
                    type="text"
                    value={areaOrigen}
                    onChange={(e) => setAreaOrigen(e.target.value)}
                    placeholder="Ej: DAF, RRHH, LEGAL"
                    required
                    className="input"
                  />
                </div>
              ) : (
                <select value={hojaId} onChange={(e) => setHojaId(e.target.value)} className="input">
                  <option value="">Sin hoja de ruta (opcional)</option>
                  {hojas.map((h) => (
                    <option key={h.id} value={h.id}>{h.codigo} — {h.area_origen}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting || !tipoId} className="btn-primary">
                {submitting ?
<AdminLayout><Spinner size="sm" /> Creando...</AdminLayout> : 'Crear Documento'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </PageShell>
    </AdminLayout>
  )
}

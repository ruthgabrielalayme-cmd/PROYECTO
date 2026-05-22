import { useEffect, useState } from 'react'
import { documentosService } from '../../api/documentosService'
import { AdminLayout, PageShell, Spinner, EmptyState, Alert } from '../../components'
import { useAuth } from '../../context/AuthContext' // Importa el hook
import type { TipoDocumento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function TiposDocumentoPage() {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'ADMIN'

  const [tipos,      setTipos]      = useState<TipoDocumento[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [showForm,   setShowForm]   = useState(false)

  const [nombre,       setNombre]       = useState('')
  const [plantillaFile, setPlantillaFile] = useState<File | null>(null)
  const [submitting,   setSubmitting]   = useState(false)

  const cargar = () => {
    setLoading(true)
    documentosService.getTipos()
      .then(setTipos)
      .catch(() => setError('No se pudieron cargar los tipos de documento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Crear el tipo (solo nombre)
      const nuevoTipo = await documentosService.crearTipo(nombre.trim().toUpperCase())

      // 2. Si hay archivo, subirlo al nuevo endpoint
      if (plantillaFile) {
        await documentosService.subirPlantilla(nuevoTipo.id, plantillaFile)
        setSuccess(`Tipo "${nombre.toUpperCase()}" creado con plantilla.`)
      } else {
        setSuccess(`Tipo "${nombre.toUpperCase()}" creado sin plantilla.`)
      }

      setNombre('')
      setPlantillaFile(null)
      setShowForm(false)
      cargar()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al crear el tipo de documento.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <PageShell
        title="Tipos de Documento"
        subtitle="Plantillas disponibles para la generación de documentos"
        action={
          isAdmin ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="btn-primary"
            >
              {showForm ? 'Cancelar' : '+ Nuevo tipo'}
            </button>
          ) : null
        }
      >
        {error   && <div className="mb-4"><Alert type="error"   message={error} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        {showForm && isAdmin && (
          <form onSubmit={handleSubmit} className="card mb-6 p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-slate-800">
              Nuevo Tipo de Documento
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: MEMORANDUM, NOTA EXTERNA, RESOLUCIÓN"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Plantilla (Word, opcional)</label>
                <input
                  type="file"
                  accept=".docx,.doc"
                  onChange={(e) => setPlantillaFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="mt-1 text-xs text-slate-500">Solo archivos .docx o .doc</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={submitting || !nombre.trim()} className="btn-primary">
                {submitting ? 'Creando...' : 'Crear tipo'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {!loading && tipos.length === 0 && (
          <EmptyState
            icon="📋"
            title="Sin tipos de documento"
            description="Creá el primer tipo para habilitar la generación de documentos."
          />
        )}

        {!loading && tipos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tipos.map((t) => (
              <div key={t.id} className="card p-5 transition hover:shadow-card-hover">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <span className="text-lg">📄</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {format(new Date(t.created_at), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-slate-800">{t.nombre}</h3>
                {t.plantilla_path ? (
                  <p className="mt-1 truncate font-mono text-xs text-slate-400">{t.plantilla_path}</p>
                ) : (
                  <p className="mt-1 text-xs italic text-slate-400">Sin plantilla configurada</p>
                )}
                <div className="mt-3 flex gap-2">
                  {t.plantilla_path && (
                    <button
                      onClick={async () => {
                        try {
                          const blob = await documentosService.descargarPlantilla(t.id)
                          const url  = URL.createObjectURL(blob)
                          const a    = document.createElement('a')
                          a.href     = url
                          a.download = `PLANTILLA-${t.nombre}.docx`
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch {
                          setError('No se pudo descargar la plantilla.')
                        }
                      }}
                      className="btn-secondary py-1 text-xs"
                    >
                      ⬇ Plantilla
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </AdminLayout>
  )
}
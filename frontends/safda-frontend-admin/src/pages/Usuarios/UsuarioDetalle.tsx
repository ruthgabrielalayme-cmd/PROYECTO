import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usuariosService } from '../../api/usuariosService'
import { AdminLayout, PageShell, Spinner, Alert, BadgeRol, BadgeEstadoUsuario } from '../../components'
import type { Usuario, Rol, EstadoUsuario } from '../../types'

const AREAS   = ['DAF', 'RRHH', 'LEGAL', 'TIC', 'ADMIN', 'PLANIFICACION', 'AUDITORIA', 'COMUNICACION']
const ROLES: Rol[] = ['FUNCIONARIO', 'ENCARGADO', 'ADMIN']
const ESTADOS: EstadoUsuario[] = ['ACTIVO', 'PENDIENTE_ASIGNACION', 'INACTIVO']

export default function UsuarioDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [usuario,    setUsuario]    = useState<Usuario | null>(null)
  const [area,       setArea]       = useState('')
  const [rol,        setRol]        = useState<Rol>('FUNCIONARIO')
  const [estado,     setEstado]     = useState<EstadoUsuario>('ACTIVO')
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    usuariosService.getById(id).then((u) => {
      setUsuario(u)
      setArea(u.area ?? '')
      setRol(u.rol)
      setEstado(u.estado)
    }).catch(() => setError('Usuario no encontrado'))
     .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      const updated = await usuariosService.update(id, {
        area:   area || undefined,
        rol,
        estado,
      })
      setUsuario(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Error al actualizar el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <AdminLayout><div className="flex justify-center py-24"><Spinner size="lg" /></div></AdminLayout>
  if (!usuario) return <AdminLayout><PageShell title="Error"><Alert type="error" message={error ?? 'No encontrado'} /></PageShell></AdminLayout>

  return (
    <AdminLayout>
      <PageShell
        title="Editar Usuario"
        subtitle="Asignación de área, rol y estado"
        action={
          <button onClick={() => navigate('/usuarios')} className="btn-secondary">
            ← Volver
          </button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Perfil del usuario */}
          <div className="card p-6">
            <div className="mb-4 flex flex-col items-center gap-3">
              {usuario.foto_url ? (
                <img src={usuario.foto_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-100" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
                  {(usuario.nombre_completo ?? usuario.correo ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="text-center">
                <p className="font-display font-semibold text-slate-800">
                  {usuario.nombre_completo ?? 'Sin nombre'}
                </p>
                <p className="text-xs text-slate-500">{usuario.correo ?? '—'}</p>
              </div>
              <div className="flex gap-2">
                <BadgeRol rol={usuario.rol} />
                <BadgeEstadoUsuario estado={usuario.estado} />
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              {[
                ['Proveedor',   usuario.provider === 'GOOGLE' ? '🔵 Google' : '🇧🇴 Ciudadanía Digital'],
                ['CI',          usuario.documento_identidad ?? '—'],
                ['Celular',     usuario.celular ?? '—'],
                ['Área actual', usuario.area ?? 'Sin asignar'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Formulario de edición */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card space-y-5 p-6">
              <h2 className="font-display text-base font-semibold text-slate-800">Asignación</h2>

              {error   && <Alert type="error"   message={error} />}
              {success && <Alert type="success" message="Usuario actualizado correctamente." />}

              {/* Área */}
              <div>
                <label className="label">Área *</label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setArea(a)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        area === a
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value.toUpperCase())}
                  placeholder="O escribí un área personalizada..."
                  className="input mt-2"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="label">Rol *</label>
                <div className="flex gap-3">
                  {ROLES.map((r) => (
                    <label key={r} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        value={r}
                        checked={rol === r}
                        onChange={() => setRol(r)}
                        className="text-primary-600"
                      />
                      <span className={`text-sm font-medium ${rol === r ? 'text-slate-800' : 'text-slate-500'}`}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="label">Estado *</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoUsuario)} className="input">
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <><Spinner size="sm" /> Guardando...</> : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => navigate('/usuarios')} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </PageShell>
    </AdminLayout>
  )
}

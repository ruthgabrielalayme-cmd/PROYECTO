import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiPlataforma } from '../../api/client'
import { Spinner } from '../../components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TrazabilidadResponse {
  qr_id: string
  documento: {
    id: string
    nombre_archivo: string
    site_generado: string | null
    estado: string
    tipo_documento: { nombre: string }
    created_at: string
  }
  hoja_ruta?: {
    codigo: string
    area_origen: string
    estado: string
    created_at: string
  }
}

export default function TrazabilidadPage() {
  const { qrId } = useParams<{ qrId: string }>()
  const [data,    setData]    = useState<TrazabilidadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!qrId) return
    // Endpoint público — no requiere JWT
    apiPlataforma.get(`/trazabilidad/${qrId}`)
      .then((r) => setData(r.data as TrazabilidadResponse))
      .catch(() => setError('No se encontró ningún documento con ese código QR.'))
      .finally(() => setLoading(false))
  }, [qrId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <span className="font-bold text-white text-sm">S</span>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">SAFDA</p>
            <p className="text-xs text-primary-300">Consulta de Trazabilidad</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Spinner size="lg" />
            <p className="text-sm text-primary-300">Verificando documento...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
            <div className="mb-3 text-4xl">❌</div>
            <h2 className="font-display text-xl font-bold text-white">Documento no encontrado</h2>
            <p className="mt-2 text-sm text-red-300">{error}</p>
            <p className="mt-4 text-xs text-slate-500">
              Si escaneaste un QR físico y este mensaje aparece, el documento puede haber sido anulado
              o el código está dañado. Contactá a la institución emisora.
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            {/* Verificado banner */}
            <div className="flex items-center gap-3 rounded-2xl border border-green-400/20 bg-green-500/10 px-5 py-4">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-display font-semibold text-green-300">Documento verificado</p>
                <p className="text-xs text-green-400">Este documento es auténtico y fue registrado en SAFDA</p>
              </div>
            </div>

            {/* Datos del documento */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-white">Información del Documento</h2>
                <a
                  href={`http://localhost:3002/documentos/${data.documento.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/30"
                >
                  Ver PDF
                </a>
              </div>
              <dl className="space-y-3">
                {[
                  ['Tipo',         data.documento.tipo_documento.nombre],
                  ['CITE',         data.documento.site_generado ?? 'No asignado'],
                  ['Estado',       data.documento.estado.replace(/_/g, ' ')],
                  ['Archivo',      data.documento.nombre_archivo],
                  ['Fecha emisión', format(new Date(data.documento.created_at), "dd 'de' MMMM yyyy", { locale: es })],
                  ['ID de verificación', data.qr_id],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                    <dd className={`text-sm font-medium text-white ${k === 'CITE' ? 'font-mono font-bold text-primary-300' : ''} ${k === 'ID de verificación' ? 'font-mono text-xs text-slate-400' : ''}`}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Hoja de ruta si existe */}
            {data.hoja_ruta && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-display text-base font-bold text-white">Hoja de Ruta</h2>
                <dl className="space-y-3">
                  {[
                    ['Código',      data.hoja_ruta.codigo],
                    ['Área origen', data.hoja_ruta.area_origen],
                    ['Estado HR',   data.hoja_ruta.estado],
                    ['Fecha inicio', format(new Date(data.hoja_ruta.created_at), "dd 'de' MMMM yyyy", { locale: es })],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                      <dd className="text-sm font-medium text-white">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Footer */}
            <div className="rounded-xl border border-white/5 bg-white/5 px-5 py-4 text-center">
              <p className="text-xs text-slate-500">
                Verificación realizada el {format(new Date(), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Estado Plurinacional de Bolivia · Sistema SAFDA
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

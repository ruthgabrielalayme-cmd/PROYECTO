import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { documentosService } from '../../api/documentosService'
import {
  AdminLayout, PageShell, Spinner, EmptyState, BadgeEstadoDoc,
  Alert,
} from '../../components'
import type { Documento, EstadoDocumento, HojaRuta, TipoDocumento } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext';
import { plataformaService } from '../../api/plataformaService';

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda,   setBusqueda]   = useState('')
  const [filtroEstado, setFiltro]   = useState<EstadoDocumento | ''>('')
  const { perfil } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [hojasRuta, setHojasRuta] = useState<HojaRuta[]>([]);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedHoja, setSelectedHoja] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

useEffect(() => {
  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [tipos, hojas, docs] = await Promise.all([
        documentosService.getTipos(),
        plataformaService.getHojasRuta(),
        documentosService.getAll(),
      ]);
      setTiposDoc(tipos);
      setHojasRuta(hojas);
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };
  cargarTodo();
}, []);

  const filtrados = documentos.filter((d) => {
    const texto = busqueda.toLowerCase()
    const matchTexto = !texto ||
      d.tipo_documento.nombre.toLowerCase().includes(texto) ||
      d.site_generado?.toLowerCase().includes(texto) ||
      d.nombre_archivo.toLowerCase().includes(texto)
    const matchEstado = !filtroEstado || d.estado === filtroEstado
    return matchTexto && matchEstado
  })

  const ESTADOS: EstadoDocumento[] = ['BORRADOR', 'PDF_SUBIDO', 'EN_FLUJO', 'FINALIZADO']

  const handleCrearDocumento = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedTipo) return;
  if (!perfil?.id) {
    setError('Usuario no identificado');
    return;
  }
  setSubmitting(true);
  setError(null);
  try {
    const tipoNombre = tiposDoc.find(t => t.id === selectedTipo)?.nombre || 'DOC';
    await documentosService.create({
      tipo_documento_id: selectedTipo,
      //hoja_ruta_id: selectedHoja || null,
      hoja_ruta_id: selectedHoja || undefined,
      creado_por: perfil.id,
    });

    setSuccess('Documento creado correctamente');
    setSelectedTipo('');
    setSelectedHoja('');
    setShowForm(false);
    
    // Recargar la lista de documentos
    const nuevos = await documentosService.getAll();
    setDocumentos(nuevos);
    
    setTimeout(() => setSuccess(null), 4000);
  } catch (err: any) {
    console.error('Error al crear documento:', err);
    const msg = err.response?.data?.message || 'Error al crear documento';
    setError(msg);
  } finally {
    setSubmitting(false);
  }
};

  const puedeCrearDoc = perfil?.rol === 'ADMIN' || perfil?.rol === 'ENCARGADO' || perfil?.rol === 'FUNCIONARIO';

  return (
    <AdminLayout>
      <PageShell
        title="Documentos"
        subtitle={`${documentos.length} documentos en el sistema`}
        action={
          puedeCrearDoc ? (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancelar' : '+ Nuevo documento'}
            </button>
          ) : null
        }
      >
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {showForm && (
          <form onSubmit={handleCrearDocumento} className="card mb-6 p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-slate-800">
              Nuevo Documento
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Tipo de documento *</label>
                <select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposDoc.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Hoja de ruta (opcional)</label>
                <select
                  value={selectedHoja}
                  onChange={(e) => setSelectedHoja(e.target.value)}
                  className="input"
                >
                  <option value="">Sin hoja de ruta</option>
                  {hojasRuta.map((hr) => (
                    <option key={hr.id} value={hr.id}>{hr.codigo}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={submitting || !selectedTipo} className="btn-primary">
                {submitting ? 'Creando...' : 'Crear documento'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por tipo, CITE o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input max-w-xs"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltro(e.target.value as EstadoDocumento | '')}
            className="input w-auto"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {!loading && filtrados.length === 0 && (
          <EmptyState icon="📄" title="Sin documentos" description="No se encontraron documentos con esos filtros." />
        )}

        {!loading && filtrados.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {['Tipo', 'CITE / Nombre', 'Estado', 'QR', 'Hoja de Ruta', 'Creado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {d.tipo_documento.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.site_generado
                        ? <span className="font-mono font-bold text-primary-700">{d.site_generado}</span>
                        : <span className="truncate text-xs text-slate-400">{d.nombre_archivo.slice(0, 30)}...</span>}
                    </td>
                    <td className="px-4 py-3"><BadgeEstadoDoc estado={d.estado} /></td>
                    <td className="px-4 py-3">
                      {d.qr_id
                        ? <span className="text-green-600 text-xs font-semibold">✓ Generado</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.hoja_ruta_id
                        ? <Link to={`/hojas-ruta/${d.hoja_ruta_id}`} className="font-mono text-xs text-primary-600 hover:underline">
                            Ver hoja →
                          </Link>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(d.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/documentos/${d.id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </AdminLayout>
  )
}

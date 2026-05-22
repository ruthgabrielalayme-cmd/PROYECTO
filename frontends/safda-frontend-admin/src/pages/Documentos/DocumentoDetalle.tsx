import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentosService } from '../../api/documentosService';
import { AdminLayout, PageShell, Spinner, BadgeEstadoDoc, Alert } from '../../components';
import type { Documento } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { plataformaService } from '../../api/plataformaService';


export default function DocumentoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const [doc, setDoc] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la subida del PDF
  const [subiendo, setSubiendo] = useState(false);
  const [siteManual, setSiteManual] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [exitoSubida, setExitoSubida] = useState<string | null>(null);
  const [obteniendoCite, setObteniendoCite] = useState(false);
  const [citeGenerado, setCiteGenerado] = useState<string | null>(null);
  

  // Determinar si puede subir PDF
  const puedeSubir = (documento: Documento) => {
    if (!perfil) return false;
    const esCreador = documento.creado_por === perfil.id;
    const esAdmin = perfil.rol === 'ADMIN';
    const estadoValido = documento.estado === 'BORRADOR' || documento.estado === 'PENDIENTE_SUBIDA';
    return (esCreador || esAdmin) && estadoValido;
  };

    // Función para obtener el CITE desde el backend
    const obtenerCite = async () => {
      if (!perfil?.area) {
        setErrorSubida('No se ha definido tu área de trabajo. Contacta al administrador.');
        return null;
      }
      setObteniendoCite(true);
      try {
        const { site } = await plataformaService.generarSite(perfil.area);
        setCiteGenerado(site);
        return site;
      } catch (err: any) {
        setErrorSubida(err.response?.data?.message || 'Error al generar el CITE');
        return null;
      } finally {
        setObteniendoCite(false);
      }
    };
  
    // Manejar la subida del PDF usando el cite generado
    const handleSubirPDF = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!archivo) {
        setErrorSubida('Selecciona un archivo PDF');
        return;
      }
      if (!doc) return;

      setSubiendo(true);
      setErrorSubida(null);

        // Si aún no tenemos cite, lo obtenemos
      let cite = citeGenerado;
      if (!cite) {
        cite = await obtenerCite();
        if (!cite) {
          setSubiendo(false);
          return;
        }
      }

      try {
        const docActualizado = await documentosService.subirPdf(doc.id, archivo, cite);
        setDoc(docActualizado);
        setExitoSubida('PDF subido correctamente. El documento ahora está en estado PDF_SUBIDO.');
        setArchivo(null);
        setCiteGenerado(null); // limpiar para futuras subidas
        setTimeout(() => setExitoSubida(null), 5000);
      } catch (err: any) {
        setErrorSubida(err.response?.data?.message || 'Error al subir el PDF');
      } finally {
        setSubiendo(false);
      }
    };

  // Cargar los datos del documento
  useEffect(() => {
    if (!id) {
      setError('No se especificó un ID de documento');
      setLoading(false);
      return;
    }
    documentosService.getById(id)
      .then(setDoc)
      .catch(() => setError('Documento no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !doc) {
    return (
      <AdminLayout>
        <PageShell title="Error">
          <Alert type="error" message={error ?? 'Documento no encontrado'} />
        </PageShell>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageShell
        title="Detalle del Documento"
        subtitle={doc.nombre_archivo}
        action={
          <button onClick={() => navigate('/documentos')} className="btn-secondary">
            ← Volver
          </button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Columna izquierda: Información del documento */}
          <div className="space-y-6">
            <div className="card space-y-4 p-6">
              <h2 className="font-display text-sm font-semibold text-slate-800">Información</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Estado</dt>
                  <dd className="text-right font-medium text-slate-800">
                    <BadgeEstadoDoc estado={doc.estado} />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Tipo</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {doc.tipo_documento.nombre}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">CITE</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {doc.site_generado ? (
                      <span className="font-mono font-bold text-primary-700">{doc.site_generado}</span>
                    ) : (
                      <span className="text-slate-400 italic">No generado</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Creado por</dt>
                  <dd className="text-right font-medium text-slate-800 font-mono text-xs">
                    {doc.creado_por}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Creado el</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {format(new Date(doc.created_at), "dd 'de' MMMM yyyy HH:mm", { locale: es })}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Actualizado</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {format(new Date(doc.updated_at), "dd 'de' MMMM yyyy HH:mm", { locale: es })}
                  </dd>
                </div>
              </dl>
              {doc.hoja_ruta_id && (
                <Link
                  to={`/hojas-ruta/${doc.hoja_ruta_id}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
                >
                  Ver hoja de ruta →
                </Link>
              )}
            </div>

            {/* Formulario de subida de PDF (solo si corresponde) */}
            {puedeSubir(doc) && (
              <div className="card p-6">
                <h2 className="font-display text-base font-semibold text-slate-800 mb-4">
                  Subir PDF definitivo
                </h2>
                <form onSubmit={handleSubirPDF} className="space-y-4">
                  <div>
                    <label className="label">Archivo PDF *</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                      className="input"
                      required
                    />
                  </div>

                  {!citeGenerado ? (
                    <button
                      type="button"
                      onClick={obtenerCite}
                      disabled={obteniendoCite}
                      className="btn-secondary"
                    >
                      {obteniendoCite ? 'Obteniendo CITE...' : 'Generar CITE automático'}
                    </button>
                  ) : (
                    <div className="rounded-md bg-primary-50 p-3">
                      <p className="text-sm text-primary-800">
                        CITE generado: <strong className="font-mono">{citeGenerado}</strong>
                      </p>
                    </div>
                  )}

                  {errorSubida && <Alert type="error" message={errorSubida} />}
                  {exitoSubida && <Alert type="success" message={exitoSubida} />}

                  <button
                    type="submit"
                    disabled={subiendo || !archivo || !citeGenerado}
                    className="btn-primary"
                  >
                    {subiendo ? 'Subiendo...' : 'Subir PDF y generar QR'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Columna derecha: Código QR */}
          <div className="card flex flex-col items-center justify-center gap-4 p-6">
            {doc.qr_id ? (
              <>
                <h2 className="font-display text-sm font-semibold text-slate-800">
                  Código QR de Trazabilidad
                </h2>
                <div className="rounded-2xl border-2 border-primary-100 p-3 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `https://safda.gob.bo/consulta/${doc.qr_id}`
                    )}`}
                    alt="QR"
                    className="h-44 w-44"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">ID del QR:</p>
                  <p className="font-mono text-xs font-semibold text-primary-700">{doc.qr_id}</p>
                </div>
                <Link to={`/trazabilidad/${doc.qr_id}`} className="btn-secondary text-xs">
                  Ver trazabilidad pública
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-4xl text-slate-200">□</span>
                <p className="text-sm text-slate-500">QR no generado</p>
                <p className="text-xs text-slate-400">Se genera al subir el PDF definitivo</p>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </AdminLayout>
  );
}
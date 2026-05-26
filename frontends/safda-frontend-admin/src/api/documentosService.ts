import { apiDocumentos } from './client'
import type { Documento, TipoDocumento } from '../types'

export const documentosService = {
  // Tipos de documento
  getTipos: () =>
    apiDocumentos.get<TipoDocumento[]>('/tipos-documento').then((r) => r.data),

  crearTipo: (data: { nombre: string }) =>
    apiDocumentos.post<TipoDocumento>('/tipos-documento', data).then((r) => r.data),

  subirPlantilla: (tipoId: string, file: File) => {
    const form = new FormData()
    form.append('archivo', file)
    return apiDocumentos.post(`/tipos-documento/${tipoId}/plantilla`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  descargarPlantilla: (tipoId: string) =>
    apiDocumentos.get(`/documentos/plantilla/${tipoId}`, { responseType: 'blob' }).then((r) => r.data),

  // Documentos
  getAll: () =>
    apiDocumentos.get<Documento[]>('/documentos').then((r) => r.data),

  getById: (id: string) =>
    apiDocumentos.get<Documento>(`/documentos/${id}`).then((r) => r.data),

  create: (data: { 
    tipo_documento_id: string; 
    hoja_ruta_id?: string; 
    creado_por: string;
  }) => apiDocumentos.post<Documento>('/documentos', data).then((r) => r.data),

  subirPdf: (id: string, file: File, site: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('site', site)
    return apiDocumentos.post<Documento>(`/documentos/${id}/subir-pdf`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}
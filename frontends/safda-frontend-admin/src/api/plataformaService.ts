import { apiPlataforma } from './client'
import type { HojaRuta, Derivacion, Bandeja, TipoBandeja } from '../types'

export const plataformaService = {
  // Hojas de ruta
  crearHojaRuta: (data: { area_origen: string; creado_por: string }) =>
    apiPlataforma.post<HojaRuta>('/hojas-ruta', data).then((r) => r.data),

  getHojasRuta: () =>
    apiPlataforma.get<HojaRuta[]>('/hojas-ruta').then((r) => r.data),

  getHojaRuta: (id: string) =>
    apiPlataforma.get<HojaRuta>(`/hojas-ruta/${id}`).then((r) => r.data),

    // En plataformaService.ts
  generarSite: (area: string, anio?: number) =>
    apiPlataforma
      .get<{ site: string }>('/correlativos/generar-site', {
        params: { area, anio: anio || new Date().getFullYear() },
      })
      .then((r) => r.data),

  // Derivaciones
  derivar: (data: {
    hoja_ruta_id: string
    documento_id: string
    remitente_id: string
    destinatario_id: string
    es_externa: boolean
    nota?: string
  }) => apiPlataforma.post<Derivacion>('/derivaciones', data).then((r) => r.data),

  aprobar: (id: string) =>
    apiPlataforma.patch<Derivacion>(`/derivaciones/${id}/aprobar`).then((r) => r.data),

  rechazar: (id: string, motivo: string) =>
    apiPlataforma.patch<Derivacion>(`/derivaciones/${id}/rechazar`, { motivo }).then((r) => r.data),

  // Bandejas
  getBandeja: (usuarioId: string, tipo?: TipoBandeja) =>
    apiPlataforma
      .get<Bandeja[]>(`/bandejas/${usuarioId}`, { params: tipo ? { tipo } : {} })
      .then((r) => r.data),
}

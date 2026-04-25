import { apiUsuarios } from './client'
import type { Usuario } from '../types'

export const usuariosService = {
  getAll:  ()           => apiUsuarios.get<Usuario[]>('/usuarios').then((r) => r.data),
  getById: (id: string) => apiUsuarios.get<Usuario>(`/usuarios/${id}`).then((r) => r.data),
  update:  (id: string, data: Partial<Pick<Usuario, 'area' | 'rol' | 'estado'>>) =>
    apiUsuarios.patch<Usuario>(`/usuarios/${id}`, data).then((r) => r.data),
}

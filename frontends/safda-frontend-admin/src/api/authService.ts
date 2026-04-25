import { apiUsuarios } from './client'
import type { LoginResponse } from '../types'

export const authService = {
  login: (token: string, provider: 'CIUDADANIA_DIGITAL' | 'GOOGLE') =>
    apiUsuarios.post<LoginResponse>('/auth/login', { token, provider }).then((r) => r.data),
}

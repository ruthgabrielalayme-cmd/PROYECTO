import axios from 'axios'

const TOKEN_KEY = 'safda_token'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t)
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY)

const makeClient = (baseURL: string) => {
  const client = axios.create({ baseURL })
  client.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  client.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err.response?.status === 401) {
        // Prevent redirect loop during login attempts
        if (!window.location.pathname.includes('/login')) {
            removeToken()
            window.location.href = '/login'
        }
      }
      return Promise.reject(err)
    },
  )
  return client
}

export const apiUsuarios   = makeClient(import.meta.env.VITE_API_USUARIOS   ?? 'http://localhost:3001')
export const apiDocumentos = makeClient(import.meta.env.VITE_API_DOCUMENTOS ?? 'http://localhost:3002')
export const apiPlataforma = makeClient(import.meta.env.VITE_API_PLATAFORMA ?? 'http://localhost:3003')

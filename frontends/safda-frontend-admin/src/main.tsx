import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './routes/PrivateRoute'
import './index.css'

import LoginPage          from './pages/Login'
import Dashboard          from './pages/Dashboard'
import UsuariosPage       from './pages/Usuarios'
import UsuarioDetalle     from './pages/Usuarios/UsuarioDetalle'
import TiposDocumentoPage from './pages/TiposDocumento'
import DocumentosPage     from './pages/Documentos'
import NuevoDocumento     from './pages/Documentos/NuevoDocumento'
import DocumentoDetalle   from './pages/Documentos/DocumentoDetalle'
import HojasRutaPage      from './pages/HojasRuta'
import HojaRutaDetalle    from './pages/HojasRuta/HojaRutaDetalle'
import TrazabilidadPage   from './pages/Trazabilidad'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas — sin JWT */}
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/trazabilidad/:qrId"     element={<TrazabilidadPage />} />

          {/* Rutas privadas — requieren JWT */}
          <Route element={<PrivateRoute />}>
            <Route path="/"                     element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"            element={<Dashboard />} />
            <Route path="/usuarios"             element={<UsuariosPage />} />
            <Route path="/usuarios/:id"         element={<UsuarioDetalle />} />
            <Route path="/tipos-documento"      element={<TiposDocumentoPage />} />
            <Route path="/documentos"           element={<DocumentosPage />} />
            <Route path="/documentos/nuevo"     element={<NuevoDocumento />} />
            <Route path="/documentos/:id"       element={<DocumentoDetalle />} />
            <Route path="/hojas-ruta"           element={<HojasRutaPage />} />
            <Route path="/hojas-ruta/:id"       element={<HojaRutaDetalle />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)

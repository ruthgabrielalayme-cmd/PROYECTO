import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './routes/PrivateRoute'
import './index.css'

import LoginPage        from './pages/Login'
import BandejaEntrada   from './pages/BandejaEntrada'
import BandejaSalida    from './pages/BandejaSalida'
import NuevoDocumento   from './pages/Documentos/NuevoDocumento'
import DetalleDocumento from './pages/Documentos/DetalleDocumento'
import SubirPdf         from './pages/Documentos/SubirPdf'
import ListaDocumentos  from './pages/Documentos/index'
import DerivarDocumento from './pages/Derivar'
import HojaRutaPage     from './pages/HojaRuta'
import ListaHojasRuta   from './pages/HojaRuta/ListaHojasRuta'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Privadas */}
          <Route element={<PrivateRoute />}>
            <Route path="/"                           element={<Navigate to="/bandeja-entrada" replace />} />
            <Route path="/bandeja-entrada"            element={<BandejaEntrada />} />
            <Route path="/bandeja-salida"             element={<BandejaSalida />} />
            <Route path="/documentos"                 element={<ListaDocumentos />} />
            <Route path="/documentos/nuevo"           element={<NuevoDocumento />} />
            <Route path="/documentos/:id"             element={<DetalleDocumento />} />
            <Route path="/documentos/:id/subir-pdf"   element={<SubirPdf />} />
            <Route path="/derivar/:id"                element={<DerivarDocumento />} />
            <Route path="/hoja-ruta/:id"              element={<HojaRutaPage />} />
            <Route path="/hojas-ruta"                 element={<ListaHojasRuta />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)

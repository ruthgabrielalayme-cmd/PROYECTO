# SAFDA — Sistema de Administración y Flujo Documental Automatizado

Monorepo de microservicios backend construido con **NestJS + TypeScript + TypeORM + MySQL**.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTENDS                                       │
│                                                                          │
│  ┌─────────────────────┐          ┌────────────────────────┐            │
│  │  Front A             │          │  Front B               │            │
│  │  Ciudadanía Digital  │          │  Google Sign-In        │            │
│  │  (OIDC / CD)         │          │  (OIDC / Google)       │            │
│  └──────────┬──────────┘          └───────────┬────────────┘            │
│             │  id_token + provider             │  id_token + provider   │
│             └──────────────┬──────────────────┘                         │
└────────────────────────────│────────────────────────────────────────────┘
                             │ POST /auth/login
                             ▼
┌──────────────────────────────────────────────────────┐
│           svc_usuarios  :3001                         │
│  ┌─────────────────────────────────────────────────┐ │
│  │  AuthService                                     │ │
│  │  • Valida token OIDC (CD o Google)               │ │
│  │  • Upsert usuario en safda_usuarios              │ │
│  │  • Emite JWT interno SAFDA                       │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  UsuariosService  (CRUD + asignación admin)      │ │
│  └─────────────────────────────────────────────────┘ │
│  BD: safda_usuarios (mysql_usuarios:3307)             │
└──────────────────────────────────────────────────────┘
                             │ JWT interno SAFDA
                             ▼
┌──────────────────────────────────────────────────────┐
│           svc_plataforma  :3003                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  HojasRutaService  + CorrelativosService         │ │
│  │  DerivacionesService  + BandejasService          │ │
│  │  • Orquesta el flujo documental                  │ │
│  │  • Llama a svc_documentos via HTTP               │ │
│  │  • Llama a svc_usuarios para validar roles       │ │
│  └─────────────────────────────────────────────────┘ │
│  BD: safda_plataforma (mysql_plataforma:3309)         │
└──────────────────────────────────────────────────────┘
                             │ HTTP interno
                             ▼
┌──────────────────────────────────────────────────────┐
│           svc_documentos  :3002                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  DocumentosService                               │ │
│  │  • Gestiona plantillas y PDFs                    │ │
│  │  • Inserta site + QR en PDF (pdf-lib)            │ │
│  │  • Almacena en STORAGE_PATH                      │ │
│  └─────────────────────────────────────────────────┘ │
│  BD: safda_documentos (mysql_documentos:3308)         │
└──────────────────────────────────────────────────────┘
```

## Inicio rápido

```bash
# 1. Clonar y configurar variables de entorno
cp services/usuarios/.env.example  services/usuarios/.env
cp services/documentos/.env.example services/documentos/.env
cp services/plataforma/.env.example services/plataforma/.env
# Editar cada .env con los valores reales

# 2. Levantar con Docker Compose
docker-compose up --build

# 3. Desarrollo local (sin Docker)
cd services/usuarios  && npm install && npm run start:dev
cd services/documentos && npm install && npm run start:dev
cd services/plataforma && npm install && npm run start:dev
```

## Servicios y puertos

| Servicio        | Puerto | Base de datos       | Puerto MySQL |
|-----------------|--------|---------------------|--------------|
| svc_usuarios    | 3001   | safda_usuarios      | 3307         |
| svc_documentos  | 3002   | safda_documentos    | 3308         |
| svc_plataforma  | 3003   | safda_plataforma    | 3309         |

## Seguridad

1. **Validación OIDC** — El token del proveedor externo (CD o Google) se valida
   en `svc_usuarios` verificando firma, issuer, audience y expiración.
2. **JWT interno SAFDA** — Después del login federado se emite un JWT firmado
   con `JWT_INTERNAL_SECRET`. Todos los demás microservicios validan este token.
3. **Guards NestJS** — `JwtAuthGuard` + `RolesGuard` protegen cada endpoint
   declarando roles requeridos con el decorador `@Roles()`.

## Supuestos documentados

Ver sección **G** al final del documento de arquitectura o el archivo `SUPUESTOS.md`.


## rutas
http://localhost:3001   → MS Usuarios
http://localhost:3002   → MS Documentos
http://localhost:3003   → MS Plataforma

GET    http://localhost:3001/usuarios
GET    http://localhost:3001/usuarios/:id
PATCH  http://localhost:3001/usuarios/:id
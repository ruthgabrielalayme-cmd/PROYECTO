# SAFDA — Sistema de Administración y Flujo Documental Automatizado

Sistema de gestión documental institucional construido con arquitectura de microservicios.
Permite a funcionarios públicos crear, derivar y tramitar documentos de forma digital,
con trazabilidad completa y autenticación federada.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS + TypeScript + TypeORM |
| Base de datos | MySQL 8.0 (una BD por microservicio) |
| Frontend A | React 18 + Vite + TailwindCSS |
| Frontend B | React 18 + Vite + TailwindCSS |
| Autenticación | OIDC federado (Ciudadanía Digital + Google) → JWT interno |
| PDF | pdf-lib (inserción de CITE y QR) |
| QR | qrcode (generación) |
| Contenedores | Docker + Docker Compose |

---

## Arquitectura del sistema

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTENDS                                    │
│                                                                           │
│  ┌──────────────────────────┐      ┌──────────────────────────────────┐  │
│  │  Frontend A              │      │  Frontend B                      │  │
│  │  safda-frontend-cd       │      │  safda-frontend-admin            │  │
│  │  Puerto 4200             │      │  Puerto 4201                     │  │
│  │                          │      │                                  │  │
│  │  Login: Ciudadanía       │      │  Login: Google Sign-In           │  │
│  │  Digital (OIDC Bolivia)  │      │  (OAuth2 / OIDC)                 │  │
│  │                          │      │                                  │  │
│  │  Usuarios:               │      │  Usuarios:                       │  │
│  │  Funcionarios y          │      │  Administradores                 │  │
│  │  Encargados de área      │      │  institucionales                 │  │
│  └────────────┬─────────────┘      └──────────────┬───────────────────┘  │
│               │ id_token + provider               │ id_token + provider  │
│               └──────────────────┬────────────────┘                      │
└──────────────────────────────────│───────────────────────────────────────┘
                                   │ POST /auth/login
                                   ▼
┌──────────────────────────────────────────────────────────┐
│  svc_usuarios  :3001                                      │
│  • Valida token OIDC (Ciudadanía Digital o Google)        │
│  • Upsert usuario → estado PENDIENTE_ASIGNACION si nuevo  │
│  • Emite JWT interno SAFDA firmado con JWT_INTERNAL_SECRET│
│  • CRUD usuarios, asignación de área y rol por admin      │
│  BD: safda_usuarios (MySQL :3306)                         │
└──────────────────────────────────┬───────────────────────┘
                                   │ JWT interno SAFDA
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│  svc_documentos  :3002    │   │  svc_plataforma  :3003           │
│  • Tipos de documento     │   │  • Hojas de ruta (correlativo)   │
│  • Plantillas .docx       │   │  • Derivaciones (interna/externa)│
│  • Creación de documentos │   │  • Bandejas (entrada/salida)     │
│  • Subida de PDFs         │   │  • Aprobación de derivaciones    │
│  • Inserción CITE + QR    │   │  • Trazabilidad pública por QR   │
│  • Almacenamiento físico  │   │  BD: safda_plataforma (MySQL)    │
│  BD: safda_documentos     │   └─────────────────────────────────┘
│  (MySQL :3306)            │
└───────────────────────────┘
```

---

## Los dos frontends

Ambos frontends son **independientes** entre sí pero acceden al **mismo backend**.
La diferencia es el método de autenticación y el perfil de usuario.

### Frontend A — Ciudadanía Digital (Funcionarios)
**Puerto 4200** · Carpeta `frontends/safda-frontend-cd`

Login mediante OpenID Connect con el proveedor de **Ciudadanía Digital Bolivia**.
Orientado a funcionarios y encargados de área que tramitan documentos día a día.

| Ruta | Función |
|------|---------|
| `/login` | Login con botón Ciudadanía Digital |
| `/bandeja-entrada` | Documentos recibidos |
| `/bandeja-salida` | Documentos enviados/derivados |
| `/documentos/nuevo` | Crear documento + descargar plantilla |
| `/documentos/:id` | Ver detalle, CITE, QR y estado |
| `/documentos/:id/subir-pdf` | Subir PDF definitivo |
| `/derivar/:id` | Derivar a otro funcionario (interna o externa) |
| `/hoja-ruta/:id` | Ver historial completo del trámite |

### Frontend B — Google Sign-In (Administradores)
**Puerto 4201** · Carpeta `frontends/safda-frontend-admin`

Login mediante **Google OAuth2**. Orientado a administradores institucionales
que gestionan usuarios, tipos de documento y monitorean el sistema.

| Ruta | Función |
|------|---------|
| `/login` | Login con botón oficial de Google |
| `/dashboard` | Panel con estadísticas generales |
| `/usuarios` | Listar, buscar y filtrar usuarios |
| `/usuarios/:id` | Asignar área, rol y estado al usuario |
| `/tipos-documento` | Crear y listar tipos de documento |
| `/documentos` | Ver todos los documentos del sistema |
| `/documentos/:id` | Detalle con QR y link a trazabilidad |
| `/hojas-ruta` | Listar hojas de ruta con filtros |
| `/hojas-ruta/:id` | Detalle con timeline de derivaciones |
| `/trazabilidad/:qrId` | **Pública** — verificación por código QR |

---

## Estructura del repositorio

```
safda/
├── start.ps1                          ← Levanta todo con un comando
├── docker-compose.yml                 ← Contenerización de servicios
├── .gitignore
├── README.md
├── SUPUESTOS.md
│
├── services/
│   ├── usuarios/                      ← svc_usuarios :3001
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── auth/
│   │       ├── usuarios/
│   │       ├── guards/
│   │       └── decorators/
│   │
│   ├── documentos/                    ← svc_documentos :3002
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── documentos/
│   │       ├── tipos-documento/
│   │       ├── guards/
│   │       └── common/
│   │
│   └── plataforma/                    ← svc_plataforma :3003
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── hojas-ruta/
│           ├── derivaciones/
│           ├── bandejas/
│           ├── correlativos/
│           ├── guards/
│           ├── decorators/
│           └── common/
│
└── frontends/
    ├── safda-frontend-cd/             ← Frontend A :4200 Funcionarios
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── package.json
    │   ├── vite.config.ts
    │   ├── tailwind.config.js
    │   ├── .env.example
    │   └── src/
    │       ├── main.tsx
    │       ├── api/
    │       ├── components/
    │       ├── context/
    │       ├── routes/
    │       ├── types/
    │       └── pages/
    │           ├── Login/
    │           ├── BandejaEntrada/
    │           ├── BandejaSalida/
    │           ├── Documentos/
    │           ├── Derivar/
    │           └── HojaRuta/
    │
    └── safda-frontend-admin/          ← Frontend B :4201 Administradores
        ├── Dockerfile
        ├── nginx.conf
        ├── package.json
        ├── vite.config.ts
        ├── tailwind.config.js
        ├── .env.example
        └── src/
            ├── main.tsx
            ├── api/
            ├── components/
            ├── context/
            ├── routes/
            ├── types/
            └── pages/
                ├── Login/
                ├── Dashboard/
                ├── Usuarios/
                ├── TiposDocumento/
                ├── Documentos/
                ├── HojasRuta/
                └── Trazabilidad/
```

---

## Puertos del sistema

| Componente | Puerto | Descripción |
|-----------|--------|-------------|
| `safda-frontend-cd` | **4200** | Frontend Funcionarios (Ciudadanía Digital) |
| `safda-frontend-admin` | **4201** | Frontend Administradores (Google) |
| `svc_usuarios` | **3001** | Microservicio de autenticación y usuarios |
| `svc_documentos` | **3002** | Microservicio de documentos y plantillas |
| `svc_plataforma` | **3003** | Microservicio de flujo documental |
| MySQL local | **3306** | Base de datos (3 schemas independientes) |

---

## Bases de datos

| Base de datos | Tablas principales |
|--------------|-------------------|
| `safda_usuarios` | `usuarios` |
| `safda_documentos` | `documentos`, `tipo_documento` |
| `safda_plataforma` | `hojas_ruta`, `derivaciones`, `bandejas`, `correlativos_site` |

---

## Inicio rápido — Desarrollo local

### Primera vez (instalación)

```powershell
# Backend — instalar dependencias
cd services\usuarios       && npm install && cd ..\..
cd services\documentos     && npm install && cd ..\..
cd services\plataforma     && npm install && cd ..\..

# Frontend — instalar dependencias
cd frontends\safda-frontend-cd    && npm install && cd ..\..
cd frontends\safda-frontend-admin && npm install && cd ..\..

# Copiar variables de entorno
copy services\usuarios\.env.example     services\usuarios\.env
copy services\documentos\.env.example   services\documentos\.env
copy services\plataforma\.env.example   services\plataforma\.env
copy frontends\safda-frontend-cd\.env.example    frontends\safda-frontend-cd\.env
copy frontends\safda-frontend-admin\.env.example frontends\safda-frontend-admin\.env
```

Editá cada `.env` con tu contraseña de MySQL y los secrets reales.

### Levantar el sistema (cada sesión)

```powershell
.\start.ps1
```

Este script abre 5 terminales automáticamente:

```
Terminal 1 → svc_usuarios    http://localhost:3001
Terminal 2 → svc_documentos  http://localhost:3002
Terminal 3 → svc_plataforma  http://localhost:3003
Terminal 4 → frontend-cd     http://localhost:4200
Terminal 5 → frontend-admin  http://localhost:4201
```

---

## Flujo de autenticación

```
Frontend A o B
     │
     │  El usuario se autentica con su IDP (CD o Google)
     │  El IDP retorna un id_token / access_token
     │
     ▼
POST /auth/login  →  svc_usuarios :3001
Body: { token: "<token_del_IDP>", provider: "CIUDADANIA_DIGITAL" | "GOOGLE" }
     │
     │  El backend valida el token contra el userinfo endpoint
     │  Crea o actualiza el usuario en safda_usuarios
     │  Emite JWT interno SAFDA
     │
     ▼
Response: { access_token: "<JWT_SAFDA>", perfil: { id, nombre, rol, area } }
     │
     │  El frontend guarda el JWT en localStorage
     │  Todas las peticiones posteriores llevan:
     │  Authorization: Bearer <JWT_SAFDA>
     ▼
Acceso al sistema según rol: FUNCIONARIO | ENCARGADO | ADMIN
```

---

## Flujo documental

```
1. Admin crea tipos de documento (MEMORANDUM, NOTA EXTERNA, etc.)
        ↓
2. Funcionario descarga la plantilla .docx
        ↓
3. Funcionario llena el documento y lo convierte a PDF
        ↓
4. Funcionario crea la Hoja de Ruta y sube el PDF
   → El sistema inserta el CITE (DAF-0042/2026) y el QR automáticamente
        ↓
5. Funcionario deriva el documento
   → INTERNA (misma área): pasa directo al destinatario
   → EXTERNA (otra área):  pasa al encargado para aprobación
        ↓
6. Destinatario recibe en su bandeja de entrada
        ↓
7. Cualquier persona puede verificar el documento escaneando el QR
   → Accede a /trazabilidad/:qrId sin necesidad de login
```

---

## Seguridad

- **Validación OIDC** — El token externo se valida contra el userinfo endpoint del IDP correspondiente (Ciudadanía Digital o Google).
- **JWT interno SAFDA** — Firmado con `JWT_INTERNAL_SECRET` compartido entre los 3 microservicios. Expira en 8 horas.
- **Guards NestJS** — `JwtAuthGuard` valida el token en cada request. `RolesGuard` verifica el rol requerido por endpoint.
- **Rutas públicas** — Solo `/auth/login` y `/trazabilidad/:qrId` son accesibles sin JWT.
- **El archivo `.env` nunca se commitea** — Está incluido en `.gitignore` de cada servicio.

---

## Variables de entorno requeridas

### Backend (común a los 3 servicios)
```env
NODE_ENV=development
PORT=3001|3002|3003
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password_mysql
DB_DATABASE=safda_usuarios|safda_documentos|safda_plataforma
JWT_INTERNAL_SECRET=secret_largo_y_seguro_compartido
```

### svc_usuarios (adicionales)
```env
JWT_INTERNAL_EXPIRES_IN=8h
CD_ISSUER=https://ciudadania.gob.bo
CD_CLIENT_ID=tu_client_id
CD_CLIENT_SECRET=tu_client_secret
CD_REDIRECT_URI=http://localhost:4200/auth/callback
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4201/auth/callback
```

### svc_documentos (adicionales)
```env
STORAGE_PATH=./storage/pdfs
MAX_FILE_SIZE_MB=10
```

### Frontends
```env
VITE_API_USUARIOS=http://localhost:3001
VITE_API_DOCUMENTOS=http://localhost:3002
VITE_API_PLATAFORMA=http://localhost:3003
# Solo frontend-cd:
VITE_CD_ISSUER=https://ciudadania.gob.bo
VITE_CD_CLIENT_ID=tu_client_id
VITE_CD_REDIRECT_URI=http://localhost:4200/auth/callback
# Solo frontend-admin:
VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
```

---

## Tests unitarios

```powershell
# Tests de autenticación (svc_usuarios)
cd services\usuarios && npm test

# Tests de correlativos de CITE (svc_plataforma)
cd services\plataforma && npm test
```

Cobertura mínima implementada:
- `AuthService` — token inválido lanza `UnauthorizedException`
- `AuthService` — usuario nuevo se crea con estado `PENDIENTE_ASIGNACION`
- `AuthService` — usuario existente actualiza metadata sin cambiar área/rol
- `CorrelativosService` — sites del mismo área/año son únicos y consecutivos

---

## Supuestos y decisiones de diseño

Ver el archivo [`SUPUESTOS.md`](./SUPUESTOS.md) para la lista completa de supuestos
asumidos sobre almacenamiento, versiones de librerías, flujos de autenticación y
decisiones de arquitectura.

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
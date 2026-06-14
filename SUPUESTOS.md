# SUPUESTOS — SAFDA

Lista explícita de todos los supuestos asumidos en el diseño e implementación.

## G.1 Almacenamiento de PDFs
- Se usa el **sistema de archivos local** del contenedor Docker para almacenar los PDFs procesados.
- La ruta se configura con la variable `STORAGE_PATH` (por defecto `./storage/pdfs`).
- En producción se recomienda reemplazar por almacenamiento externo (S3, MinIO, Azure Blob Storage).
- El volumen Docker `documentos_storage` persiste los archivos entre reinicios del contenedor.

## G.2 Versión de MySQL
- Se usa **MySQL 8.0** (imagen `mysql:8.0` en Docker).
- La collation por defecto es `utf8mb4_unicode_ci`.
- Se usa el driver `mysql2` para Node.js.

## G.3 Librería QR
- Se usa la librería **`qrcode` v1.5.x** (npm) para generar los códigos QR en formato PNG base64.
- El QR encode la URL pública de consulta: `https://safda.gob.bo/consulta/<qr_id>`.
- El dominio `safda.gob.bo` es un placeholder; debe reemplazarse con la URL real en producción.

## G.4 Librería PDF
- Se usa **`pdf-lib` v1.17.x** para modificar los PDFs: insertar texto (site) e imagen (QR).
- El site se inserta en la esquina superior derecha de la primera página.
- El QR se inserta en la esquina superior izquierda de la primera página (70×70 px).
- Se asume que los PDFs enviados son válidos y no están encriptados.

## G.5 Plantillas de documentos
- Las plantillas son archivos `.docx` almacenados en el servidor bajo una ruta configurada en `TipoDocumento.plantilla_path`.
- Se asume que las plantillas existen físicamente en el servidor al momento de la descarga.
- La descarga de plantillas **no requiere autenticación** en el diseño actual (puede ajustarse).

## G.6 Validación del token OIDC de Ciudadanía Digital
- Se asume que el **frontend completa el flujo OIDC** y obtiene el `access_token`.
- El backend valida el token llamando al `userinfo_endpoint` descubierto vía `/.well-known/openid-configuration`.
- No se valida la firma del `id_token` directamente en el backend (se delega al userinfo endpoint).
- En producción se recomienda validar también la firma JWT usando `jwks_uri`.

## G.7 Validación del token de Google
- Se llama a `https://www.googleapis.com/oauth2/v3/userinfo` con el `access_token`.
- Se asume que el `access_token` tiene scope `openid profile email`.

## G.8 Comunicación entre microservicios
- Los microservicios se comunican via **HTTP interno** usando `fetch` nativo de Node.js 20.
- No se usa un bus de mensajes (RabbitMQ, Kafka) ni gRPC en esta versión inicial.
- Se asume que `svc_plataforma` tiene acceso de red a `svc_usuarios` y `svc_documentos`.

## G.9 Encargado del área en derivaciones externas
- Cuando una derivación es externa, la notificación va a la bandeja del `remitente_id` (el propio remitente actúa como encargado provisionalmente).
- En producción, `svc_plataforma` debería consultar a `svc_usuarios` para obtener el UUID del `ENCARGADO` del área del remitente.

## G.10 Site correlativo en hojas de ruta
- El código de `HojaRuta` se genera con un contador simple basado en `COUNT`. En producción se recomienda usar la misma lógica transaccional de `CorrelativoSite`.

## G.11 Generación de sites desde plataforma
- El `site` es generado por `svc_plataforma` (CorrelativosService) utilizando el endpoint `GET /correlativos/generar-site` y pasado como parámetro al endpoint `POST /documentos/:id/subir-pdf` de `svc_documentos`.
- El frontend orquesta esta llamada: primero llama a plataforma para obtener el site, luego llama a documentos para subir el PDF.

## G.12 Runtime y versión de Node.js
- Se usa **Node.js 20 LTS** (imagen `node:20-alpine`).
- Se usa `fetch` nativo (disponible desde Node.js 18).

## G.13 Multipart upload
- Los PDFs se suben via `multipart/form-data` usando `multer` en modo `memoryStorage` (el archivo queda en Buffer antes de escribirse a disco).
- El límite de tamaño se configura con `MAX_FILE_SIZE_MB` (por defecto 10 MB).

## G.14 Autenticación en svc_documentos y svc_plataforma
- Ambos servicios validan el JWT interno SAFDA con la misma `JWT_INTERNAL_SECRET`.
- No existe autenticación service-to-service separada (todos los servicios comparten el mismo secret).

## G.15 Base de datos de desarrollo vs producción
- `synchronize: true` solo en `NODE_ENV !== 'production'`.
- En producción se deben usar migraciones TypeORM (`npm run migration:run`).

## G.16 Tests unitarios
- Los tests mockean las dependencias externas (fetch, repositorios TypeORM, DataSource).
- No se incluyen tests de integración ni e2e en esta versión inicial.

## G.17 Logs
- Se usa el `Logger` nativo de NestJS con nivel estructurado.
- No se configura un log aggregator externo (ELK, Datadog) en esta versión.

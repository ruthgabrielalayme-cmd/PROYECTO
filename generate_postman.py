import json
import uuid

collection = {
    "info": {
        "_postman_id": str(uuid.uuid4()),
        "name": "SAFDA - Sistema de Administración y Flujo Documental",
        "description": "Colección completa de endpoints para probar los 3 microservicios de SAFDA: Usuarios, Documentos y Plataforma.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {"key": "base_usuarios", "value": "http://localhost:3001", "type": "string"},
        {"key": "base_documentos", "value": "http://localhost:3002", "type": "string"},
        {"key": "base_plataforma", "value": "http://localhost:3003", "type": "string"},
        {"key": "jwt_token", "value": "", "type": "string", "description": "Se llena automáticamente al hacer login"},
        {"key": "usuario_id", "value": "", "type": "string"},
        {"key": "tipo_documento_id", "value": "", "type": "string"},
        {"key": "documento_id", "value": "", "type": "string"},
        {"key": "hoja_ruta_id", "value": "", "type": "string"},
        {"key": "derivacion_id", "value": "", "type": "string"},
    ],
    "item": []
}

# ─── FOLDER 1: MS USUARIOS ───────────────────────────────────────────────────
folder_usuarios = {
    "name": "🔐 MS Usuarios — :3001",
    "item": [
        {
            "name": "Login con Google",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.access_token) {",
                            "    pm.collectionVariables.set('jwt_token', res.access_token);",
                            "    pm.collectionVariables.set('usuario_id', res.perfil.id);",
                            "    console.log('✅ JWT guardado:', res.access_token);",
                            "}",
                            "pm.test('Login exitoso', function() {",
                            "    pm.response.to.have.status(200);",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "provider": "GOOGLE",
                        "token": "PEGA_AQUI_TU_ID_TOKEN_DE_GOOGLE"
                    }, indent=2)
                },
                "url": {"raw": "{{base_usuarios}}/auth/login", "host": ["{{base_usuarios}}"], "path": ["auth", "login"]}
            }
        },
        {
            "name": "Login con Ciudadanía Digital",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.access_token) {",
                            "    pm.collectionVariables.set('jwt_token', res.access_token);",
                            "    pm.collectionVariables.set('usuario_id', res.perfil.id);",
                            "    console.log('✅ JWT guardado:', res.access_token);",
                            "}",
                            "pm.test('Login exitoso', function() {",
                            "    pm.response.to.have.status(200);",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "provider": "CIUDADANIA_DIGITAL",
                        "token": "PEGA_AQUI_TU_ID_TOKEN_DE_CIUDADANIA_DIGITAL"
                    }, indent=2)
                },
                "url": {"raw": "{{base_usuarios}}/auth/login", "host": ["{{base_usuarios}}"], "path": ["auth", "login"]}
            }
        },
        {
            "name": "Listar todos los usuarios",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_usuarios}}/usuarios", "host": ["{{base_usuarios}}"], "path": ["usuarios"]}
            }
        },
        {
            "name": "Obtener usuario por ID",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_usuarios}}/usuarios/{{usuario_id}}", "host": ["{{base_usuarios}}"], "path": ["usuarios", "{{usuario_id}}"]}
            }
        },
        {
            "name": "Actualizar usuario (asignar área y rol)",
            "request": {
                "method": "PATCH",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "area": "DAF",
                        "rol": "FUNCIONARIO",
                        "estado": "ACTIVO"
                    }, indent=2)
                },
                "url": {"raw": "{{base_usuarios}}/usuarios/{{usuario_id}}", "host": ["{{base_usuarios}}"], "path": ["usuarios", "{{usuario_id}}"]}
            }
        }
    ]
}

# ─── FOLDER 2: MS DOCUMENTOS ────────────────────────────────────────────────
folder_documentos = {
    "name": "📄 MS Documentos — :3002",
    "item": [
        {
            "name": "Crear tipo de documento",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.id) {",
                            "    pm.collectionVariables.set('tipo_documento_id', res.id);",
                            "    console.log('✅ tipo_documento_id guardado:', res.id);",
                            "}",
                            "pm.test('Tipo creado', function() {",
                            "    pm.response.to.have.status(201);",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "nombre": "MEMORANDUM",
                        "plantilla_path": "./plantillas/memorandum.docx"
                    }, indent=2)
                },
                "url": {"raw": "{{base_documentos}}/tipos-documento", "host": ["{{base_documentos}}"], "path": ["tipos-documento"]}
            }
        },
        {
            "name": "Listar tipos de documento",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_documentos}}/tipos-documento", "host": ["{{base_documentos}}"], "path": ["tipos-documento"]}
            }
        },
        {
            "name": "Descargar plantilla",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_documentos}}/documentos/plantilla/{{tipo_documento_id}}", "host": ["{{base_documentos}}"], "path": ["documentos", "plantilla", "{{tipo_documento_id}}"]}
            }
        },
        {
            "name": "Crear documento",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.id) {",
                            "    pm.collectionVariables.set('documento_id', res.id);",
                            "    console.log('✅ documento_id guardado:', res.id);",
                            "}",
                            "pm.test('Documento creado', function() {",
                            "    pm.response.to.have.status(201);",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "hoja_ruta_id": "{{hoja_ruta_id}}",
                        "tipo_documento_id": "{{tipo_documento_id}}",
                        "creado_por": "{{usuario_id}}"
                    }, indent=2)
                },
                "url": {"raw": "{{base_documentos}}/documentos", "host": ["{{base_documentos}}"], "path": ["documentos"]}
            }
        },
        {
            "name": "Obtener documento por ID",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_documentos}}/documentos/{{documento_id}}", "host": ["{{base_documentos}}"], "path": ["documentos", "{{documento_id}}"]}
            }
        },
        {
            "name": "Subir PDF (con site + QR)",
            "request": {
                "method": "POST",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "body": {
                    "mode": "formdata",
                    "formdata": [
                        {
                            "key": "archivo",
                            "type": "file",
                            "src": "",
                            "description": "Selecciona el archivo PDF del documento"
                        },
                        {
                            "key": "area",
                            "value": "DAF",
                            "type": "text",
                            "description": "Sigla del área para generar el site (ej: DAF)"
                        }
                    ]
                },
                "url": {"raw": "{{base_documentos}}/documentos/{{documento_id}}/subir-pdf", "host": ["{{base_documentos}}"], "path": ["documentos", "{{documento_id}}", "subir-pdf"]}
            }
        },
        {
            "name": "Listar todos los documentos",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_documentos}}/documentos", "host": ["{{base_documentos}}"], "path": ["documentos"]}
            }
        }
    ]
}

# ─── FOLDER 3: MS PLATAFORMA ────────────────────────────────────────────────
folder_plataforma = {
    "name": "🔄 MS Plataforma — :3003",
    "item": [
        {
            "name": "Crear Hoja de Ruta",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.id) {",
                            "    pm.collectionVariables.set('hoja_ruta_id', res.id);",
                            "    console.log('✅ hoja_ruta_id guardado:', res.id);",
                            "}",
                            "pm.test('Hoja de ruta creada', function() {",
                            "    pm.response.to.have.status(201);",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "area_origen": "DAF",
                        "creado_por": "{{usuario_id}}"
                    }, indent=2)
                },
                "url": {"raw": "{{base_plataforma}}/hojas-ruta", "host": ["{{base_plataforma}}"], "path": ["hojas-ruta"]}
            }
        },
        {
            "name": "Listar Hojas de Ruta",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_plataforma}}/hojas-ruta", "host": ["{{base_plataforma}}"], "path": ["hojas-ruta"]}
            }
        },
        {
            "name": "Obtener Hoja de Ruta por ID",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_plataforma}}/hojas-ruta/{{hoja_ruta_id}}", "host": ["{{base_plataforma}}"], "path": ["hojas-ruta", "{{hoja_ruta_id}}"]}
            }
        },
        {
            "name": "Derivar documento (interna — mismo área)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.id) {",
                            "    pm.collectionVariables.set('derivacion_id', res.id);",
                            "    console.log('✅ derivacion_id guardado:', res.id);",
                            "}",
                            "pm.test('Derivación creada', function() {",
                            "    pm.response.to.have.status(201);",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "hoja_ruta_id": "{{hoja_ruta_id}}",
                        "documento_id": "{{documento_id}}",
                        "remitente_id": "{{usuario_id}}",
                        "destinatario_id": "REEMPLAZA_CON_UUID_DESTINATARIO",
                        "es_externa": False,
                        "nota": "Derivación interna de prueba"
                    }, indent=2)
                },
                "url": {"raw": "{{base_plataforma}}/derivaciones", "host": ["{{base_plataforma}}"], "path": ["derivaciones"]}
            }
        },
        {
            "name": "Derivar documento (externa — requiere aprobación)",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "hoja_ruta_id": "{{hoja_ruta_id}}",
                        "documento_id": "{{documento_id}}",
                        "remitente_id": "{{usuario_id}}",
                        "destinatario_id": "REEMPLAZA_CON_UUID_DESTINATARIO_OTRA_AREA",
                        "es_externa": True,
                        "nota": "Derivación externa — pasa por encargado"
                    }, indent=2)
                },
                "url": {"raw": "{{base_plataforma}}/derivaciones", "host": ["{{base_plataforma}}"], "path": ["derivaciones"]}
            }
        },
        {
            "name": "Aprobar derivación (encargado)",
            "request": {
                "method": "PATCH",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {"raw": "{{base_plataforma}}/derivaciones/{{derivacion_id}}/aprobar", "host": ["{{base_plataforma}}"], "path": ["derivaciones", "{{derivacion_id}}", "aprobar"]}
            }
        },
        {
            "name": "Rechazar derivación (encargado)",
            "request": {
                "method": "PATCH",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "motivo": "El documento requiere correcciones antes de ser enviado"
                    }, indent=2)
                },
                "url": {"raw": "{{base_plataforma}}/derivaciones/{{derivacion_id}}/rechazar", "host": ["{{base_plataforma}}"], "path": ["derivaciones", "{{derivacion_id}}", "rechazar"]}
            }
        },
        {
            "name": "Bandeja ENTRANTE",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {
                    "raw": "{{base_plataforma}}/bandejas/{{usuario_id}}?tipo=ENTRANTE",
                    "host": ["{{base_plataforma}}"],
                    "path": ["bandejas", "{{usuario_id}}"],
                    "query": [{"key": "tipo", "value": "ENTRANTE"}]
                }
            }
        },
        {
            "name": "Bandeja SALIENTE",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {
                    "raw": "{{base_plataforma}}/bandejas/{{usuario_id}}?tipo=SALIENTE",
                    "host": ["{{base_plataforma}}"],
                    "path": ["bandejas", "{{usuario_id}}"],
                    "query": [{"key": "tipo", "value": "SALIENTE"}]
                }
            }
        },
        {
            "name": "Bandeja PENDIENTE APROBACIÓN (encargado)",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {
                    "raw": "{{base_plataforma}}/bandejas/{{usuario_id}}?tipo=PENDIENTE_APROBACION",
                    "host": ["{{base_plataforma}}"],
                    "path": ["bandejas", "{{usuario_id}}"],
                    "query": [{"key": "tipo", "value": "PENDIENTE_APROBACION"}]
                }
            }
        }
    ]
}

# ─── FOLDER 4: FLUJO COMPLETO ────────────────────────────────────────────────
folder_flujo = {
    "name": "🚀 Flujo Completo (orden sugerido)",
    "description": "Ejecuta estos requests en orden para probar el flujo completo de SAFDA",
    "item": [
        {
            "name": "PASO 1 — Login",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "provider": "GOOGLE",
                        "token": "PEGA_AQUI_TU_ID_TOKEN"
                    }, indent=2)
                },
                "url": {"raw": "{{base_usuarios}}/auth/login", "host": ["{{base_usuarios}}"], "path": ["auth", "login"]}
            }
        },
        {
            "name": "PASO 2 — Crear tipo de documento",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({"nombre": "MEMORANDUM", "plantilla_path": "./plantillas/memorandum.docx"}, indent=2)
                },
                "url": {"raw": "{{base_documentos}}/tipos-documento", "host": ["{{base_documentos}}"], "path": ["tipos-documento"]}
            }
        },
        {
            "name": "PASO 3 — Crear Hoja de Ruta",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({"area_origen": "DAF", "creado_por": "{{usuario_id}}"}, indent=2)
                },
                "url": {"raw": "{{base_plataforma}}/hojas-ruta", "host": ["{{base_plataforma}}"], "path": ["hojas-ruta"]}
            }
        },
        {
            "name": "PASO 4 — Crear Documento",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "hoja_ruta_id": "{{hoja_ruta_id}}",
                        "tipo_documento_id": "{{tipo_documento_id}}",
                        "creado_por": "{{usuario_id}}"
                    }, indent=2)
                },
                "url": {"raw": "{{base_documentos}}/documentos", "host": ["{{base_documentos}}"], "path": ["documentos"]}
            }
        },
        {
            "name": "PASO 5 — Subir PDF",
            "request": {
                "method": "POST",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "body": {
                    "mode": "formdata",
                    "formdata": [
                        {"key": "archivo", "type": "file", "src": "", "description": "Selecciona tu PDF"},
                        {"key": "area", "value": "DAF", "type": "text"}
                    ]
                },
                "url": {"raw": "{{base_documentos}}/documentos/{{documento_id}}/subir-pdf", "host": ["{{base_documentos}}"], "path": ["documentos", "{{documento_id}}", "subir-pdf"]}
            }
        },
        {
            "name": "PASO 6 — Derivar documento",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{jwt_token}}"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "hoja_ruta_id": "{{hoja_ruta_id}}",
                        "documento_id": "{{documento_id}}",
                        "remitente_id": "{{usuario_id}}",
                        "destinatario_id": "REEMPLAZA_CON_UUID_DESTINATARIO",
                        "es_externa": False,
                        "nota": "Envío para revisión"
                    }, indent=2)
                },
                "url": {"raw": "{{base_plataforma}}/derivaciones", "host": ["{{base_plataforma}}"], "path": ["derivaciones"]}
            }
        },
        {
            "name": "PASO 7 — Ver bandeja entrante",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}],
                "url": {
                    "raw": "{{base_plataforma}}/bandejas/{{usuario_id}}?tipo=ENTRANTE",
                    "host": ["{{base_plataforma}}"],
                    "path": ["bandejas", "{{usuario_id}}"],
                    "query": [{"key": "tipo", "value": "ENTRANTE"}]
                }
            }
        }
    ]
}

collection["item"] = [folder_usuarios, folder_documentos, folder_plataforma, folder_flujo]

output_path = "SAFDA_Postman_Collection.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(collection, f, ensure_ascii=False, indent=2)

print(f"✅ Colección generada: {output_path}")
print(f"Total de carpetas: {len(collection['item'])}")
total_requests = sum(len(folder['item']) for folder in collection['item'])
print(f"Total de requests: {total_requests}")
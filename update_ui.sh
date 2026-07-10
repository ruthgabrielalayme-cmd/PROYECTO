#!/bin/bash
patch -p0 << 'DIFF'
--- frontends/safda-frontend-admin/src/pages/Documentos/DocumentoDetalle.tsx
+++ frontends/safda-frontend-admin/src/pages/Documentos/DocumentoDetalle.tsx
@@ -79,6 +79,16 @@
     }
   }

+  const handleDescargarWord = async () => {
+    if (!id) return
+    try {
+      const blob = await documentosService.descargarWord(id)
+      const url = URL.createObjectURL(blob)
+      window.open(url, '_blank')
+    } catch (err) {
+      alert('Error al descargar el archivo Word')
+    }
+  }
+
   return (
     <AdminLayout>
       <PageShell
@@ -155,9 +165,12 @@
                   <div>
                     <p className="text-xs text-slate-500 mb-1">Archivo de Word actual:</p>
                     {doc.archivo_word_path ? (
-                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
-                        📄 Documento cargado
-                      </span>
+                      <button
+                        onClick={handleDescargarWord}
+                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer border border-blue-200"
+                      >
+                        📄 Ver documento Word
+                      </button>
                     ) : (
                       <span className="text-sm text-slate-400 italic">Ningún archivo subido</span>
                     )}
DIFF

#!/bin/bash
patch -p0 << 'DIFF'
--- services/documentos/src/documentos/documentos.controller.ts
+++ services/documentos/src/documentos/documentos.controller.ts
@@ -165,6 +165,27 @@
   }

   /**
+   * GET /documentos/:id/word
+   * Retorna el archivo Word asociado al documento en estado BORRADOR.
+   */
+  @Get(':id/word')
+  async getWord(
+    @Param('id', ParseUUIDPipe) id: string,
+    @Res() res: Response,
+  ): Promise<void> {
+    const doc = await this.documentosService.findOne(id);
+    if (!doc.archivo_word_path) {
+      throw new BadRequestException('El documento no tiene un archivo Word subido');
+    }
+
+    const absolutePath = path.resolve(doc.archivo_word_path);
+    if (!fs.existsSync(absolutePath)) {
+      throw new BadRequestException('Archivo Word no encontrado en el servidor');
+    }
+
+    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
+    res.setHeader('Content-Disposition', `attachment; filename="${doc.nombre_archivo}.docx"`);
+    res.sendFile(absolutePath);
+  }
+
+  /**
    * GET /documentos/:id/pdf
    * Retorna el archivo PDF asociado al documento.
    */
DIFF

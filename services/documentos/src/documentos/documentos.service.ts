import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { Documento, EstadoDocumento } from './documento.entity';
import { TiposDocumentoService } from '../tipos-documento/tipos-documento.service';
import { CreateDocumentoDto } from './documento.dto';

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    @InjectRepository(Documento)
    private readonly repo: Repository<Documento>,
    private readonly tiposDocumentoService: TiposDocumentoService,
    private readonly config: ConfigService,
  ) {}

  async findAllByUser(user: { id: string; rol: string; area: string | null }): Promise<Documento[]> {
  const qb = this.repo.createQueryBuilder('doc')
    .leftJoinAndSelect('doc.tipo_documento', 'tipo');

  if (user.rol === 'ADMIN') {
    // ADMIN ve todos
    return qb.getMany();
  } else if (user.rol === 'ENCARGADO') {
    // ENCARGADO ve documentos de su misma área (los creados por usuarios de esa área)
    // Nota: necesitas relacionar usuario con área. Como 'creado_por' es UUID, no tenemos área ahí directamente.
    // Opción: asumir que el área está en la hoja de ruta asociada, o en el perfil del creador (vía otra consulta).
    // Simplificación (si el campo 'area' del usuario es confiable): filtrar por documentos cuya hoja de ruta tenga area_origen igual a user.area.
    // Para ello, necesitas hacer un join con hojas_ruta (si tienes la relación en la entidad Documento, pero no la tienes; solo hoja_ruta_id).
    // Alternativa: traer todos y filtrar en memoria (no eficiente para grandes volúmenes). Mejor hacer consulta a svc_plataforma o agregar campo 'area' en Documento.
    // Por ahora, asumimos que ENCARGADO ve todos los documentos (temporal). Implementación real requiere ajuste.
    // Recomiendo agregar columna 'area' en Documento al crearlo (copiado del área del usuario o de la HR).
    // Dado que es un paso adicional, lo omitimos aquí por brevedad, pero te indico la idea.
    if (!user.area) return [];
    qb.andWhere('doc.area = :area', { area: user.area });
    return qb.getMany();
  } else {
    // FUNCIONARIO: documentos de su área o donde es creador
    qb.andWhere('(doc.area = :area OR doc.creado_por = :userId)', { area: user.area, userId: user.id });
    return qb.getMany();
  }
}

  // ─── Crear documento (BORRADOR) ──────────────────────────────────────────

  async create(dto: CreateDocumentoDto): Promise<Documento> {
    const tipo = await this.tiposDocumentoService.findOne(dto.tipo_documento_id);

    const tempId = uuidv4();
    const nombre_archivo = `DOC-${tempId}-${tipo.nombre.replace(/\s+/g, '_')}.pdf`;

    const doc = this.repo.create({
      tipo_documento: tipo,
      hoja_ruta_id: dto.hoja_ruta_id ?? null,
      nombre_archivo,
      estado: EstadoDocumento.BORRADOR,
      creado_por: dto.creado_por,
      area: dto.area ?? null, 
    });

    const saved = await this.repo.save(doc);
    this.logger.log(`Documento creado: ${saved.id}`);
    return saved;
  }

  // ─── Obtener documentos ────────────────────────────────────────────────

  async findAll(): Promise<Documento[]> {
    return this.repo.find({ relations: ['tipo_documento'] });
  }

  async findOne(id: string): Promise<Documento> {
    const doc = await this.repo.findOne({
      where: { id },
      relations: ['tipo_documento'],
    });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);
    return doc;
  }

  // ─── Descargar plantilla ─────────────────────────────────────────────────

  async obtenerRutaPlantilla(tipoId: string): Promise<{
    filePath: string;
    fileName: string;
  }> {
    const tipo = await this.tiposDocumentoService.findOne(tipoId);

    if (!tipo.plantilla_path) {
      throw new NotFoundException(
        `El tipo de documento ${tipo.nombre} no tiene plantilla configurada`,
      );
    }

    const tempId = uuidv4();
    const fileName = `PLANTILLA-${tempId}-${tipo.nombre.replace(/\s+/g, '_')}.docx`;

    return { filePath: tipo.plantilla_path, fileName };
  }

  // ─── Subir PDF definitivo con site + QR ──────────────────────────────────

  async subirPdf(
    documentoId: string,
    fileBuffer: Buffer,
    site: string,
  ): Promise<Documento> {
    const doc = await this.findOne(documentoId);

    if (doc.estado === EstadoDocumento.EN_FLUJO) {
      throw new BadRequestException(
        'El documento ya está en flujo y no puede modificarse',
      );
    }

    const qrId = uuidv4();
    const qrUrl = `https://safda.gob.bo/consulta/${qrId}`;

    // Procesar el PDF: insertar site y QR
    const pdfProcesado = await this.insertarSiteYQr(fileBuffer, site, qrUrl);

    // Guardar el PDF procesado en storage
    const storagePath = this.config.get<string>('STORAGE_PATH') ?? './storage/pdfs';
    await fs.mkdir(storagePath, { recursive: true });

    const fileName = `${documentoId}-${Date.now()}.pdf`;
    const filePath = path.join(storagePath, fileName);
    await fs.writeFile(filePath, pdfProcesado);

    // Actualizar el documento
    doc.archivo_path = filePath;
    doc.qr_id = qrId;
    doc.site_generado = site;
    doc.estado = EstadoDocumento.PDF_SUBIDO;

    const saved = await this.repo.save(doc);
    this.logger.log(`PDF subido para documento ${documentoId}, site: ${site}`);
    return saved;
  }

  // ─── Insertar site y QR en el PDF ────────────────────────────────────────

  private async insertarSiteYQr(
    pdfBuffer: Buffer,
    site: string,
    qrUrl: string,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { width } = firstPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Insertar site en la parte superior derecha del PDF
    firstPage.drawText(site, {
      x: width - 150,
      y: firstPage.getHeight() - 30,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    // Generar QR como imagen PNG (base64)
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 80,
      margin: 1,
    });
    // Extraer base64 sin prefijo
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBytes = Buffer.from(qrBase64, 'base64');

    const qrImage = await pdfDoc.embedPng(qrBytes);

    // Colocar el QR en la esquina superior izquierda
    firstPage.drawImage(qrImage, {
      x: 20,
      y: firstPage.getHeight() - 90,
      width: 70,
      height: 70,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

async cambiarEstado(id: string, nuevoEstado: EstadoDocumento): Promise<Documento> {
  const doc = await this.findOne(id);
  if (doc.estado === EstadoDocumento.EN_FLUJO && nuevoEstado !== EstadoDocumento.EN_FLUJO) {
    throw new BadRequestException('No se puede cambiar el estado de un documento en flujo');
  }
  if (doc.estado !== EstadoDocumento.PDF_SUBIDO && nuevoEstado === EstadoDocumento.EN_FLUJO) {
    throw new BadRequestException('Solo se puede pasar a EN_FLUJO si el documento está en PDF_SUBIDO');
  }
  doc.estado = nuevoEstado;
  return this.repo.save(doc);
}
}

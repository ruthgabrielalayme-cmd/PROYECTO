import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Documento } from './documento.entity';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { DocumentosInternosController } from './internos.controller';
import { DocumentosPublicosController } from './publicos.controller';
import { TiposDocumentoModule } from '../tipos-documento/tipos-documento.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento]),
    HttpModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize:
            (config.get<number>('MAX_FILE_SIZE_MB') ?? 10) * 1024 * 1024,
        },
        storage: undefined, // memoryStorage por defecto (buffer en memoria)
      }),
      inject: [ConfigService],
    }),
    TiposDocumentoModule,
  ],
  providers: [DocumentosService],
  controllers: [DocumentosController, DocumentosInternosController, DocumentosPublicosController],
  exports: [DocumentosService],
})
export class DocumentosModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosModule } from './documentos/documentos.module';
import { TiposDocumentoModule } from './tipos-documento/tipos-documento.module';
import { AuthModule } from './common/auth.module';
import { Documento } from './documentos/documento.entity';
import { TipoDocumento } from './tipos-documento/tipo-documento.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [Documento, TipoDocumento],
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    DocumentosModule,
    TiposDocumentoModule,
    AuthModule,
  ],
})
export class AppModule {}

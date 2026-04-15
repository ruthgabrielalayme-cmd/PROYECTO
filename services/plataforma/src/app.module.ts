import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './common/auth.module';
import { HojasRutaModule } from './hojas-ruta/hojas-ruta.module';
import { DerivacionesModule } from './derivaciones/derivaciones.module';
import { BandejasModule } from './bandejas/bandejas.module';
import { CorrelativosModule } from './correlativos/correlativos.module';
import { HojaRuta } from './hojas-ruta/hoja-ruta.entity';
import { Derivacion } from './derivaciones/derivacion.entity';
import { Bandeja } from './bandejas/bandeja.entity';
import { CorrelativoSite } from './correlativos/correlativo-site.entity';

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
        entities: [HojaRuta, Derivacion, Bandeja, CorrelativoSite],
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    HojasRutaModule,
    DerivacionesModule,
    BandejasModule,
    CorrelativosModule,
    AuthModule,
  ],
})
export class AppModule {}

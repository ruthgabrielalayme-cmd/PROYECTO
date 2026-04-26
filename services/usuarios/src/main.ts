import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3001;
  const logger = new Logger('Bootstrap');

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      'http://localhost:4200',  // Frontend Funcionarios
      'http://localhost:4201',  // Frontend Admin
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  // ──────────────────────────────────────────────────────────────────────────

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  logger.log(`svc_usuarios running on port ${port}`);
}

bootstrap();
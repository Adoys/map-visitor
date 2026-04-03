import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  // ✅ Habilitar CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true, // por si usas cookies o tokens con credenciales
  });

  // Asegurar que exista la carpeta pública para subir archivos
  const fs = await import('fs');
  const mkdirp = (path: string) => fs.promises.mkdir(path, { recursive: true });
  await mkdirp(join(__dirname, '..', 'public', 'uploads', 'company-settings'));

  // ✅ Habilitar validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en DTOs
      forbidNonWhitelisted: true, // lanza error si hay propiedades extra
      transform: true, // convierte automáticamente tipos primitivos
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

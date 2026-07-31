import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app
    .get(ConfigService)
    .getOrThrow<AppConfig>('app');

  // Parse cookies so the JWT auth guard can read the `session` cookie.
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // The SPA runs on a different origin; allow it to send/receive the
  // session cookie cross-origin.
  app.enableCors({ origin: appConfig.appBaseUrl, credentials: true });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

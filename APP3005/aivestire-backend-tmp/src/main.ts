import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import type { RequestHandler } from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const protocol = url.protocol.toLowerCase();
    const isDefaultPort =
      (protocol === 'https:' && url.port === '443') ||
      (protocol === 'http:' && url.port === '80');
    const portSuffix = url.port && !isDefaultPort ? `:${url.port}` : '';

    return `${protocol}//${hostname}${portSuffix}`;
  } catch {
    return trimmed.replace(/\/$/, '').toLowerCase();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit further
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Backward compatibility: support legacy "/api"-prefixed URLs (even repeated).
  // Internal controllers are mounted without this prefix (for example: /v1/tryon/...).
  app.use((req, _res, next) => {
    if (req.url === '/api') {
      req.url = '/';
    } else {
      req.url = req.url.replace(/^(\/api)+\//, '/');
    }
    next();
  });

  const cookieMw: RequestHandler = cookieParser();
  app.use(cookieMw);

  // Parse allowed origins from environment
  const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') ?? [])
    .map((o) => normalizeOrigin(o))
    .filter((o) => o.length > 0);

  // Always allow localhost origins for development
  const localOrigins = new Set(
    [
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'https://aivestire.com',
      'https://www.aivestire.com',
      'https://uat.aivestire.com',
      'https://dev.aivestire.com',
      'https://prod.aivestire.com',
    ].map((origin) => normalizeOrigin(origin)),
  );

  const allowedOriginSet = new Set(allowedOrigins);

  // console.log('🔧 CORS Configuration:');
  // console.log(
  //   '   Allowed origins:',
  //   allowedOrigins.length > 0 ? allowedOrigins : 'all (development mode)',
  // );

  // CORS configuration for production
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);

      // Always allow localhost for development
      if (localOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      // Check if origin is in the allowed list
      if (allowedOriginSet.size > 0) {
        if (allowedOriginSet.has(normalizedOrigin)) {
          callback(null, true);
        } else {
          console.warn(
            `⚠️ CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`,
          );
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // No allowed origins configured - allow all (development mode)
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  let validatorPackage: any = null;
  let transformerPackage: any = null;

  try {
    validatorPackage = require('class-validator');
    transformerPackage = require('class-transformer');
  } catch (error) {
    console.warn(
      '[Bootstrap] Validation dependencies unavailable; skipping ValidationPipe initialization:',
      error instanceof Error ? error.message : error,
    );
  }

  if (validatorPackage && transformerPackage) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        validatorPackage,
        transformerPackage,
      }),
    );
  } else {
    console.warn(
      '[Bootstrap] ValidationPipe was not registered due to missing validation packages.',
    );
  }
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  const url = await app.getUrl();
  console.log(`[bootstrap] Nest application listening on ${url}`);
}
void bootstrap().catch((error) => {
  console.error('[bootstrap] fatal startup error:', error);
  process.exit(1);
});

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as bodyParser from 'body-parser';
import * as cloudinary from 'cloudinary';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { configs } from './shared/configs';
import { DataLogsService } from './shared/datalogs';
import { AllExceptionsFilter } from './shared/exceptions';
import { LogInterceptor } from './shared/interceptors';
import { startRedis } from './shared/utils';

function buildSwaggerDocument(app: any) {
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Inventors Backend Documentation')
    .setDescription('All API description and usage')
    .setExternalDoc('Postman Collection', '/docs/api-json')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/api', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const logInterceptor = app.get<LogInterceptor>(LogInterceptor);
  const throttlerGuard = app.get<ThrottlerGuard>(ThrottlerGuard);
  const allExceptionsFilter = app.get<AllExceptionsFilter>(AllExceptionsFilter);

  // Add this to global for easy access anywhere in the app.
  global.jwtService = app.get<JwtService>(JwtService);
  global.dataLogsService = app.get<DataLogsService>(DataLogsService);
  global.nestApp = app;

  app.useGlobalFilters(allExceptionsFilter);
  app.useGlobalGuards(throttlerGuard);
  app.useGlobalInterceptors(logInterceptor);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api/v1');
  app.useLogger(app.get(Logger));
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.use(
    '/docs/structures',
    express.static(path.join(__dirname, '../documentation')),
  );

  buildSwaggerDocument(app);

  cloudinary.v2.config(configs().cloudinary); // cloudinary setup
  console.log(`Redis connecting...`);
  await startRedis();

  await app.listen(process.env.PORT || 3888);
  console.log(`Inventor application is running on: ${await app.getUrl()}`);
}
bootstrap();

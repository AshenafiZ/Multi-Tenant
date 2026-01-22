import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip extra properties
    forbidNonWhitelisted: true, // 400 on extra fields
    transform: true,           // Auto-transform strings → numbers/Dates
    transformOptions: {
      enableImplicitConversion: true, // "1" → 1
    },
  }));

  // ✅ GLOBAL ERROR HANDLER (from common/filters)
  app.useGlobalFilters(new AllExceptionsFilter());

  // ✅ SWAGGER SETUP (auto-docs)
  const config = new DocumentBuilder()
    .setTitle('Property Platform API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token obtained from /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints (login, register, bootstrap)')
    .addTag('properties', 'Property management endpoints')
    .addTag('images', 'Image upload and management')
    .addTag('users', 'User management (admin only)')
    .addTag('favorites', 'Favorites management')
    .addTag('messages', 'Messaging between users')
    .addServer(process.env.API_URL || 'http://localhost:3000', 'Development server')
    .addServer('https://production-url.com', 'Production server')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep auth token after page refresh
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Property Platform API Docs',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // ✅ CORS for React frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
}
bootstrap();
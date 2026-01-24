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
    .setVersion('1.0')
    .addBearerAuth()  // JWT docs
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

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
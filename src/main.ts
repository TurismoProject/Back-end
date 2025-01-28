import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  const configSwagger = new DocumentBuilder()
    .setTitle('Turismo Project API')
    .setDescription('API para o projeto conheça seu destino')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  console.log(`🚀 Server is running on port: ${port}`);
  await app.listen(port);
}
bootstrap();

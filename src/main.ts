import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configSwagger = new DocumentBuilder()
    .setTitle('Turismo Project API')
    .setDescription('API para o projeto conheça seu destino')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();

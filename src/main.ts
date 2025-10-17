import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('v1');
 
  console.log(`Application is running on port ${process.env.PORT} `);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

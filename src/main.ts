import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';

import { AppModule } from './app.module';
import { setupSwagger } from './shared/http/swagger/setup-swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.register(multipart);
  setupSwagger(app);
  await app.listen(3000);
}

void bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Prisma-style env loading (Node >=20.6): reads ./.env if present. In prod the
// env is injected by the platform and there is no file — then this is a no-op.
try {
  process.loadEnvFile();
} catch {
  // no .env file — env already provided by the environment.
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

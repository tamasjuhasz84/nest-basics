import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Keep it minimal: no global pipes/validation/etc.
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:3000`);
}

bootstrap();

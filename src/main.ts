import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Keep it minimal: no global pipes/validation/etc.
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:3000`);
}

bootstrap();

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ---- Global validation ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- Global filter ----
  app.useGlobalFilters(new HttpExceptionFilter());

  // ---- Global interceptor ----
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ---- Swagger (ne fusson test alatt) ----
  if (process.env.NODE_ENV !== "test") {
    const config = new DocumentBuilder()
      .setTitle("Nest Items API")
      .setDescription("Minimal NestJS + MongoDB (Mongoose) demo API")
      .setVersion("1.0")
      .addTag("items")
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
}

bootstrap();

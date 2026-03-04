import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { setupApp } from "./app.setup";
import { Logger } from "nestjs-pino";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupApp(app);
  app.useLogger(app.get(Logger));

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

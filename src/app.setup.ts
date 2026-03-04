import { INestApplication, ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import helmet from "helmet";
import * as compression from "compression";

function parseCsv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function setupApp(app: INestApplication) {
  const allowed = new Set(parseCsv(process.env.CORS_ORIGIN));
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (process.env.CORS_ORIGIN === "*") return cb(null, true);
      return allowed.has(origin) ? cb(null, true) : cb(null, false);
    },
    credentials: process.env.CORS_CREDENTIALS === "true",
    methods: process.env.CORS_METHODS ?? "GET,POST,PATCH,DELETE,OPTIONS",
  });

  // --- Security: Helmet ---
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // --- Security/Perf: Compression ---
  app.use(compression({ threshold: 0 }));

  // --- Global validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // --- Global filter ---
  app.useGlobalFilters(new HttpExceptionFilter());

  return app;
}

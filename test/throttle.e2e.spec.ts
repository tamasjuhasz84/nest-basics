import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";

import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";

import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

describe("Throttling (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: 2 }],
        }),
      ],
      providers: [ThrottlerGuard],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalGuards(moduleRef.get(ThrottlerGuard));

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("returns 429 after too many requests", async () => {
    await request(app.getHttpServer()).get("/items").expect(200);
    await request(app.getHttpServer()).get("/items").expect(200);

    const res = await request(app.getHttpServer()).get("/items").expect(429);

    expect(res.body.statusCode).toBe(429);
    expect(res.body.path).toBe("/items");
    expect(res.body.requestId).toBeDefined();
  });
});

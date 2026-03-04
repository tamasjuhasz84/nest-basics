import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { AppModule } from "../src/app.module";
import { setupApp } from "../src/app.setup";

describe("security: cors", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.CORS_ORIGIN = "http://localhost:5173,http://localhost:3000";
    process.env.CORS_METHODS = "GET,POST,PATCH,DELETE,OPTIONS";
    process.env.CORS_CREDENTIALS = "true";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("allows CORS for whitelisted origin (preflight)", async () => {
    const origin = "http://localhost:5173";

    const res = await request(app.getHttpServer())
      .options("/items")
      .set("Origin", origin)
      .set("Access-Control-Request-Method", "GET")
      .expect(204);

    expect(res.headers["access-control-allow-origin"]).toBe(origin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-methods"]).toBeDefined();
  });

  it("does not allow CORS for non-whitelisted origin", async () => {
    const res = await request(app.getHttpServer())
      .get("/items")
      .set("Origin", "https://evil.example")
      .expect(200);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

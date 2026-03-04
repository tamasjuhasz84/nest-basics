import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { AppModule } from "../src/app.module";
import { setupApp } from "../src/app.setup";

describe("security: helmet", () => {
  let app: INestApplication;

  beforeAll(async () => {
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

  it("sets basic security headers", async () => {
    const res = await request(app.getHttpServer()).get("/items").expect(200);

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["referrer-policy"]).toBeDefined();
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});

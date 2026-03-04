import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { AppModule } from "../src/app.module";
import { setupApp } from "../src/app.setup";

describe("security: production error policy", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = "production";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);

    const server = app.getHttpAdapter().getInstance();
    server.get("/__test__/boom", () => {
      throw new Error("very-secret-internal-message");
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not leak internal error message in production", async () => {
    const res = await request(app.getHttpServer())
      .get("/__test__/boom")
      .expect(500);

    expect(res.body.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");
    expect(res.body.details).toBeUndefined();
  });
});

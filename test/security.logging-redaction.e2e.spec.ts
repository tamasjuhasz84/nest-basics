import { Test } from "@nestjs/testing";
import { INestApplication, Module } from "@nestjs/common";
import * as request from "supertest";
import { LoggerModule, PinoLogger } from "nestjs-pino";

import { setupApp } from "../src/app.setup";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.headers['set-cookie']",
            "req.headers['x-api-key']",
            "req.headers['x-auth-token']",
            "req.body.password",
            "req.body.token",
          ],
          censor: "[REDACTED]",
        },
      },
    }),
  ],
})
class TestAppModule {}

describe("logging: redaction smoke (fast)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);

    const server = app.getHttpAdapter().getInstance();
    server.get("/__test__/ok", (_req: any, res: any) => {
      res.json({ ok: true });
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not log Authorization header value", async () => {
    const infoSpy = jest
      .spyOn(PinoLogger.prototype, "info")
      .mockImplementation(() => undefined as any);

    const errSpy = jest
      .spyOn(PinoLogger.prototype, "error")
      .mockImplementation(() => undefined as any);

    await request(app.getHttpServer())
      .get("/__test__/ok")
      .set("Authorization", "Bearer TOPSECRET")
      .expect(200);

    const combined = [
      ...infoSpy.mock.calls
        .flat()
        .map((x) => (typeof x === "string" ? x : JSON.stringify(x))),
      ...errSpy.mock.calls
        .flat()
        .map((x) => (typeof x === "string" ? x : JSON.stringify(x))),
    ].join("\n");

    expect(combined).not.toContain("TOPSECRET");

    infoSpy.mockRestore();
    errSpy.mockRestore();
  });
});

import { Test } from "@nestjs/testing";
import { Controller, Get, INestApplication, Module } from "@nestjs/common";
import * as request from "supertest";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule, PinoLogger } from "nestjs-pino";

import { LoggingInterceptor } from "../src/common/interceptors/logging.interceptor";
import { setupApp } from "../src/app.setup";

@Controller("__test__")
class TestController {
  @Get("ok")
  ok() {
    return { ok: true };
  }
}

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

@Module({
  imports: [TestAppModule],
  controllers: [TestController],
  providers: [
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
class TestWithInterceptorModule {}

describe("logging: redaction smoke (fast)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestWithInterceptorModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);

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

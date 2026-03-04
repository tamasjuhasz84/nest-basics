import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { AppModule } from "../src/app.module";
import { setupApp } from "../src/app.setup";

describe("security: compression", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);

    const server = app.getHttpAdapter().getInstance() as {
      get: (
        path: string,
        handler: (req: unknown, res: { json: (b: unknown) => void }) => void,
      ) => void;
    };

    server.get("/__test__/big", (_req, res) => {
      res.json({ data: "x".repeat(200_000) });
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("sets gzip content-encoding when client accepts gzip", async () => {
    const res = await request(app.getHttpServer())
      .get("/__test__/big")
      .set("Accept-Encoding", "gzip")
      .expect(200);

    expect(res.headers["content-encoding"]).toBe("gzip");
    const vary = res.headers["vary"];
    if (Array.isArray(vary)) {
      expect(vary.join(",").toLowerCase()).toContain("accept-encoding");
    } else {
      expect(String(vary).toLowerCase()).toContain("accept-encoding");
    }
  });
});

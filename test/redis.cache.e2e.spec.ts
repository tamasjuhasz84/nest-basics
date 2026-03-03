import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { AppModule } from "../src/app.module";
import { getConnectionToken } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

describe("Redis cache (smoke)", () => {
  let app: INestApplication;
  let cache: Cache;
  let conn: Connection;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    cache = app.get<Cache>(CACHE_MANAGER);
    conn = app.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await conn?.close();
    await app?.close();
  });

  it("can set/get/del via CACHE_MANAGER (redis)", async () => {
    const key = `smoke:redis:${Date.now()}`;

    await cache.set(key, "ok", 30);

    const v = await cache.get(key);
    expect(v).toBe("ok");

    await cache.del(key);

    const v2 = await cache.get(key);
    expect(v2).toBeUndefined();
  });
});

jest.setTimeout(60_000);
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { getConnectionToken } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

import { getModelToken } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { Item } from "../src/items/item.schema";
import { AuditLog } from "../src/audit/audit.schema";
import { createTestApp } from "./utils/create-test-app";

describe("Items API (e2e + real DB)", () => {
  let app: INestApplication;
  let conn: Connection;
  let itemModel: Model<any>;
  let auditModel: Model<any>;

  beforeAll(async () => {
    app = await createTestApp();

    itemModel = app.get<Model<any>>(getModelToken(Item.name));
    auditModel = app.get<Model<any>>(getModelToken(AuditLog.name));
    // TEST DB NOTE:
    // We intentionally drop all indexes and re-sync from Mongoose schema here.
    // Reason: schema index definitions can change over time (e.g. text index name/weights).
    // Without this, Mongo may keep older equivalent indexes and crash on startup with
    // "equivalent index already exists with a different name/options".
    await itemModel.collection.dropIndexes().catch(() => {});
    await itemModel.syncIndexes();
    await auditModel.syncIndexes();
    conn = app.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await itemModel.deleteMany({});
    await auditModel.deleteMany({});
  });

  afterAll(async () => {
    await conn?.close();
    await app?.close();
  });

  it("POST /items -> creates item", async () => {
    const res = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Learn Nest", done: true })
      .expect(201);

    expect(res.body).toMatchObject({
      name: "Learn Nest",
      done: true,
    });
    expect(res.body._id).toBeTruthy();
  });

  it("GET /items -> returns list sorted (createdAt desc)", async () => {
    const res = await request(app.getHttpServer()).get("/items").expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);

    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(20);
    expect(typeof res.body.meta.total).toBe("number");
    expect(typeof res.body.meta.hasNext).toBe("boolean");

    const items = res.body.data;

    // ha volt benne rendezés ellenőrzés, azt items-re futtasd
    if (items.length >= 2) {
      const a = new Date(items[0].createdAt).getTime();
      const b = new Date(items[1].createdAt).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it("GET /items/:id -> 404 if valid id but missing", async () => {
    const id = "6998624072d280f3ebb0e165"; // valid ObjectId format
    const res = await request(app.getHttpServer())
      .get(`/items/${id}`)
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: "Not Found",
      path: `/items/${id}`,
    });
  });

  it("PATCH /items/:id -> updates item", async () => {
    const created = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "X" })
      .expect(201);

    const id = created.body._id;

    const updated = await request(app.getHttpServer())
      .patch(`/items/${id}`)
      .send({ done: true })
      .expect(200);

    expect(updated.body).toMatchObject({
      _id: id,
      name: "X",
      done: true,
    });
  });

  it("DELETE /items/:id -> returns deleted true", async () => {
    const created = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Del" })
      .expect(201);

    const id = created.body._id;

    const res = await request(app.getHttpServer())
      .delete(`/items/${id}`)
      .expect(200);

    expect(res.body).toEqual({ deleted: true, id });
  });

  it("GET /items/123 -> 400 invalid ObjectId (ParseObjectIdPipe + Filter)", async () => {
    const res = await request(app.getHttpServer())
      .get("/items/123")
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      path: "/items/123",
    });
  });
  it("adds x-request-id header on success", async () => {
    const res = await request(app.getHttpServer()).get("/items/health");
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("includes requestId in error body (invalid ObjectId)", async () => {
    const res = await request(app.getHttpServer()).get("/items/123");
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  it("GET /items?page=1&limit=1 -> returns meta + hasNext", async () => {
    const res = await request(app.getHttpServer())
      .get("/items?page=1&limit=1")
      .expect(200);

    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(res.body.data.length);
  });
  it("GET /items/search?q= -> returns paginated results", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Alpha" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Beta" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/items/search?q=Alpha")
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.data.some((x: any) => x.name === "Alpha")).toBe(true);
  });
  (process.env.NODE_ENV === "test" ? it.skip : it)(
    "GET /docs-json -> returns openapi spec",
    async () => {
      const res = await request(app.getHttpServer())
        .get("/docs-json")
        .expect(200);

      expect(res.body.openapi).toBeDefined();
      expect(res.body.paths).toBeDefined();
    },
  );
  it("POST /items -> 409 on duplicate name when done=false (partial unique) + error shape", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "UniqueName" }) // done default false
      .expect(201);

    const res = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "UniqueName" }) // done default false
      .expect(409);

    expect(res.body).toMatchObject({
      statusCode: 409,
      error: "Conflict",
      path: "/items",
    });
    expect(res.body.requestId).toBeDefined();
  });
  it("GET /items?q= -> uses text search and returns matches", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "nestjs swagger guide" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "mongodb indexing" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/items?q=swagger")
      .expect(200);

    expect(res.body.data.some((x: any) => x.name.includes("swagger"))).toBe(
      true,
    );
  });
  it("GET /items/search?q= -> uses text search", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Alpha Beta" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/items/search?q=Alpha")
      .expect(200);

    expect(res.body.data.some((x: any) => x.name.includes("Alpha"))).toBe(true);
  });
  it("POST /items -> allows duplicate name when previous is done=true (partial unique)", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "ArchiveMe", done: true })
      .expect(201);

    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "ArchiveMe", done: false })
      .expect(201);
  });
  it("POST /items -> transaction rollback (item + audit not persisted)", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "__FAIL_TX__" })
      .expect(500);

    expect(await itemModel.countDocuments({ name: "__FAIL_TX__" })).toBe(0);

    expect(
      await auditModel.countDocuments({
        action: "ITEM_CREATED",
        "payload.itemId": { $exists: true },
      }),
    ).toBe(0);
  });
  it("GET /items/search?q= -> sorts by textScore (smoke)", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "nestjs swagger swagger guide" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "nestjs swagger guide" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/items/search?q=swagger&limit=10")
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0].name).toContain("swagger swagger");
  });
  it("B3: list cache invalidates via version bump after create", async () => {
    // 1) első list (cache-eli az üres listát)
    const first = await request(app.getHttpServer())
      .get("/items?page=1&limit=50")
      .expect(200);

    expect(first.body.data).toBeDefined();
    expect(Array.isArray(first.body.data)).toBe(true);

    // 2) create
    const created = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "CacheInvalidate_Create", done: false })
      .expect(201);

    const id = created.body._id;
    expect(id).toBeTruthy();

    // 3) list újra (version bump miatt új cache key, friss adat)
    const second = await request(app.getHttpServer())
      .get("/items?page=1&limit=50")
      .expect(200);

    expect(second.body.data.some((x: any) => x._id === id)).toBe(true);
    expect(
      second.body.data.some((x: any) => x.name === "CacheInvalidate_Create"),
    ).toBe(true);
  });
  it("B3: item cache + list cache invalidates after update", async () => {
    const created = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "CacheInvalidate_Update", done: false })
      .expect(201);

    const id = created.body._id;

    // cache-eld a GET /items/:id-t
    await request(app.getHttpServer()).get(`/items/${id}`).expect(200);

    // list cache-elve is legyen
    await request(app.getHttpServer())
      .get("/items?page=1&limit=50")
      .expect(200);

    // update
    await request(app.getHttpServer())
      .patch(`/items/${id}`)
      .send({ done: true })
      .expect(200);

    // item GET: már done:true legyen (ha item cache nem törlődik, ez bukna)
    const after = await request(app.getHttpServer())
      .get(`/items/${id}`)
      .expect(200);

    expect(after.body.done).toBe(true);

    // list GET: frissüljön (version bump miatt)
    const list = await request(app.getHttpServer())
      .get("/items?page=1&limit=50")
      .expect(200);

    expect(list.body.data.some((x: any) => x._id === id)).toBe(true);
  });

  describe("C1: validation & edge cases (e2e)", () => {
    it("C1: POST /items -> 400 on extra field (forbidNonWhitelisted)", async () => {
      const res = await request(app.getHttpServer())
        .post("/items")
        .send({ name: "Ok", done: false, hackerField: "nope" })
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        path: "/items",
      });
      expect(res.body.requestId).toBeDefined();
    });
    it("C1: POST /items -> 400 on name minLength fail", async () => {
      const res = await request(app.getHttpServer())
        .post("/items")
        .send({ name: "" })
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        path: "/items",
      });
    });
    it("C1: POST /items -> 400 on invalid name type", async () => {
      const res = await request(app.getHttpServer())
        .post("/items")
        .send({ name: 123 })
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        path: "/items",
      });
    });
    it("C1: GET /items -> 400 when page=0", async () => {
      const res = await request(app.getHttpServer())
        .get("/items?page=0")
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.path).toContain("/items");
    });
    it("C1: GET /items -> 400 when limit too large", async () => {
      const res = await request(app.getHttpServer())
        .get("/items?limit=999")
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.path).toContain("/items");
    });
    it("C1: GET /items -> 400 when done is invalid", async () => {
      const res = await request(app.getHttpServer())
        .get("/items?done=asd")
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.path).toContain("/items");
    });
    it("C1: PATCH /items/:id -> 400 on extra field (forbidNonWhitelisted)", async () => {
      const created = await request(app.getHttpServer())
        .post("/items")
        .send({ name: "PatchMe" })
        .expect(201);

      const id = created.body._id;

      const res = await request(app.getHttpServer())
        .patch(`/items/${id}`)
        .send({ done: true, extra: "nope" })
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        path: `/items/${id}`,
      });
    });
    it("C1: GET /items/:id -> 400 on invalid ObjectId", async () => {
      const res = await request(app.getHttpServer())
        .get("/items/not-an-objectid")
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        path: "/items/not-an-objectid",
      });
    });
  });
});

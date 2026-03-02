process.env.NODE_ENV = "test";
process.env.MONGO_URI =
  "mongodb://localhost:27018/nest-items-test?replicaSet=rs0";
jest.setTimeout(60_000);
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { getConnectionToken } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";

describe("Items API (e2e + real DB)", () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // ugyanaz a pipeline, mint prod
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    conn = app.get<Connection>(getConnectionToken());
    await conn.dropCollection("items").catch(() => {});
    await conn.collection("items").createIndex({ done: 1, createdAt: -1 });
    await conn.collection("items").createIndex({ createdAt: -1 });
    await conn
      .collection("items")
      .createIndex(
        { name: 1 },
        { unique: true, partialFilterExpression: { done: false } },
      );
    await conn.collection("items").createIndex({ name: "text" });
  });

  beforeEach(async () => {
    await conn.collection("items").deleteMany({});
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
    // seed
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Alpha" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Beta" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/items/search?like=Al")
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
  it("POST /items -> 409 on duplicate name", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "UniqueName" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "UniqueName" })
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
  it("POST /items -> 409 on duplicate name when done=false (partial unique)", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Same", done: false })
      .expect(201);

    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "Same", done: false })
      .expect(409);
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
  it("POST /items -> transaction rollback (item not persisted)", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "__FAIL_TX__" })
      .expect(500);

    const list = await request(app.getHttpServer())
      .get("/items?like=__FAIL_TX__")
      .expect(200);
    expect(list.body.data.length).toBe(0);
  });
});

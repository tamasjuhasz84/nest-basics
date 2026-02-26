process.env.NODE_ENV = "test";
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
  });

  beforeEach(async () => {
    await conn.collection("items").deleteMany({});
  });

  afterAll(async () => {
    await conn.close();
    await app.close();
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
});

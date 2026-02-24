import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { AppModule } from "../src/app.module";
import { ITEMS_REPOSITORY } from "../src/items/items.tokens";
import { setupApp } from "../src/app.setup";

describe("Items API (e2e)", () => {
  let app: INestApplication;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    search: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ITEMS_REPOSITORY)
      .useValue(mockRepo)
      .compile();

    app = moduleRef.createNestApplication();

    setupApp(app);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /items/123 -> 400 (invalid ObjectId) via ParseObjectIdPipe + Filter", async () => {
    const res = await request(app.getHttpServer())
      .get("/items/123")
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      path: "/items/123",
    });
    // message nálad string lesz: "Invalid ObjectId: 123"
    expect(typeof res.body.message).toBe("string");
  });

  it("GET /items/:id valid but missing -> 404 via NotFoundException + Filter", async () => {
    const id = "6998624072d280f3ebb0e165"; // valid ObjectId format
    mockRepo.findById.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .get(`/items/${id}`)
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: "Not Found",
      path: `/items/${id}`,
    });
    expect(res.body.message).toContain(id);
  });

  it("POST /items with extra field -> 400 (forbidNonWhitelisted)", async () => {
    const res = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "x", kutya: true })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      path: "/items",
    });
    // message itt array szokott lenni
    expect(res.body.message).toBeTruthy();
  });
});

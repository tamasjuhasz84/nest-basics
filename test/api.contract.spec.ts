import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { getModelToken } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { Item } from "../src/items/item.schema";

let itemModel: Model<any>;

describe("API Contract (snapshot)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    itemModel = app.get<Model<any>>(getModelToken(Item.name));

    const config = new DocumentBuilder()
      .setTitle("Test API")
      .setVersion("1.0")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  });

  beforeEach(async () => {
    await itemModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /items -> paginated response shape is stable", async () => {
    const res = await request(app.getHttpServer())
      .get("/items?page=1&limit=2")
      .expect(200);

    // 🔒 explicit meta contract védelem
    expect(res.body.meta).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        pages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
        returned: expect.any(Number),
      }),
    );

    const normalized = {
      ...res.body,
      data: res.body.data.map((x: any) => ({
        ...x,
        _id: "ID",
        createdAt: "DATE",
        updatedAt: "DATE",
      })),
    };

    expect(normalized).toMatchSnapshot();
  });

  it("POST /items -> error shape stable (400)", async () => {
    const res = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "" })
      .expect(400);

    const normalized = {
      ...res.body,
      requestId: "RID",
      timestamp: "DATE",
    };

    expect(normalized).toMatchSnapshot();
  });

  it("POST /items -> conflict error shape stable (409)", async () => {
    await request(app.getHttpServer())
      .post("/items")
      .send({ name: "DupName", done: false })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post("/items")
      .send({ name: "DupName", done: false })
      .expect(409);

    const normalized = {
      ...res.body,
      requestId: "RID",
      timestamp: "DATE",
    };

    expect(normalized).toMatchSnapshot();
  });

  it("OpenAPI contract stable (snapshot)", async () => {
    const config = new DocumentBuilder()
      .setTitle("Test API")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, config);

    expect(document).toMatchSnapshot();
  });
});

import { Test } from "@nestjs/testing";
import { MongooseModule, getConnectionToken } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";

import { Item, ItemSchema } from "../src/items/item.schema";
import { MongooseItemsRepository } from "../src/items/infrastructure/mongoose-items.repository";
import { ListItemsQueryDto } from "../src/items/dto/list-items.query.dto";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

process.env.MONGO_URI =
  "mongodb://localhost:27018/nest-items-test-repo?replicaSet=rs0";

jest.setTimeout(60_000);

describe("MongooseItemsRepository (integration)", () => {
  let repo: MongooseItemsRepository;
  let conn: Connection;
  let itemModel: Model<any>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGO_URI!),
        MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
      ],
      providers: [MongooseItemsRepository],
    }).compile();

    repo = moduleRef.get(MongooseItemsRepository);
    conn = moduleRef.get(getConnectionToken());
    itemModel = moduleRef.get(getModelToken(Item.name));

    await conn.dropDatabase(); // 🔥 teljes DB reset
    await itemModel.syncIndexes();
  });

  beforeEach(async () => {
    await itemModel.deleteMany({});
  });

  afterAll(async () => {
    await conn.close();
  });

  it("filters by done", async () => {
    await itemModel.create([
      { name: "A", done: true },
      { name: "B", done: false },
    ]);

    const query = new ListItemsQueryDto();
    query.done = "true" as any;

    const result = await repo.findAll({ ...query, done: true } as any);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("A");
  });

  it("paginates correctly", async () => {
    await itemModel.create([{ name: "A" }, { name: "B" }, { name: "C" }]);

    const result = await repo.findAll({
      page: 2,
      limit: 1,
      sortBy: "createdAt",
      order: "asc",
    } as any);

    expect(result.length).toBe(1);
  });

  it("sorts by name asc", async () => {
    await itemModel.create([{ name: "C" }, { name: "A" }, { name: "B" }]);

    const result = await repo.findAll({
      page: 1,
      limit: 10,
      sortBy: "name",
      order: "asc",
    } as any);

    expect(result.length).toBe(3);
    expect(result.map((x: any) => x.name)).toEqual(["A", "B", "C"]);
  });

  it("text search returns matches", async () => {
    await itemModel.create([
      { name: "nestjs swagger guide" },
      { name: "mongodb indexing" },
    ]);

    const result = await repo.findAll({
      page: 1,
      limit: 10,
      q: "swagger",
    } as any);

    expect(result.length).toBe(1);
    expect(result[0].name).toContain("swagger");
  });

  it("count respects filters", async () => {
    await itemModel.create([
      { name: "A", done: true },
      { name: "B", done: false },
    ]);

    const count = await repo.count({ done: true } as any);

    expect(count).toBe(1);
  });
});

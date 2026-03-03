import { Test } from "@nestjs/testing";
import { ItemsService } from "./items.service";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { NotFoundException } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { AuditService } from "../audit/audit.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";

function createMockCache() {
  const store = new Map<string, any>();

  const cache: Cache = {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: any) => {
      store.set(key, value);
      return true as any;
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return true as any;
    }),
  } as unknown as Cache;

  return cache;
}

describe("ItemsService", () => {
  let service: ItemsService;
  let cache: Cache;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(), // <-- EZ KELL
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    search: jest.fn(),
  };

  const auditMock = { write: jest.fn() };

  beforeEach(async () => {
    // reset mock call history + default impl
    jest.clearAllMocks();

    cache = createMockCache();

    const session = {
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession: async () => {},
    };

    const connMock = {
      startSession: jest.fn(async () => session),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: ITEMS_REPOSITORY, useValue: mockRepo },
        { provide: AuditService, useValue: auditMock },
        { provide: getConnectionToken(), useValue: connMock },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(ItemsService);
  });

  it("should return item if found", async () => {
    const fakeItem = { _id: "123", name: "Test", done: false };

    mockRepo.findById.mockResolvedValue(fakeItem);

    const result = await service.findOne("123");

    expect(result).toEqual(fakeItem);
    expect(mockRepo.findById).toHaveBeenCalledWith("123");
  });

  it("should throw NotFoundException if item not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.findOne("123")).rejects.toThrow(NotFoundException);
  });

  it("should throw NotFoundException if update target not found", async () => {
    mockRepo.updateById.mockResolvedValue(null);

    await expect(service.update("123", { done: true } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should throw NotFoundException if remove target not found", async () => {
    mockRepo.deleteById.mockResolvedValue(null);

    await expect(service.remove("123")).rejects.toThrow(NotFoundException);
  });

  it("should return deleted response if remove succeeded", async () => {
    mockRepo.deleteById.mockResolvedValue({ _id: "123" });

    const result = await service.remove("123");

    expect(result).toEqual({ deleted: true, id: "123" });
    expect(mockRepo.deleteById).toHaveBeenCalledWith("123");
  });

  // --- CACHE TESZTEK ---

  it("findOne caches result (repo hit once, then cache hit)", async () => {
    mockRepo.findById.mockResolvedValue({ _id: "1", name: "A", done: false });

    const first = await service.findOne("1");
    const second = await service.findOne("1");

    expect(first).toMatchObject({ _id: "1", name: "A" });
    expect(second).toMatchObject({ _id: "1", name: "A" });

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(cache.get as any).toHaveBeenCalled();
    expect(cache.set as any).toHaveBeenCalled();
  });

  it("findAll caches list by versioned key (repo hit once for same query)", async () => {
    mockRepo.findAll.mockResolvedValue([{ _id: "1", name: "A", done: false }]);
    mockRepo.count.mockResolvedValue(1);

    const query: any = { page: 1, limit: 20 };

    const first = await service.findAll(query);
    const second = await service.findAll(query);

    expect(first.data.length).toBe(1);
    expect(second.data.length).toBe(1);

    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.count).toHaveBeenCalledTimes(1);
  });

  it("update invalidates item cache and bumps list version", async () => {
    mockRepo.updateById.mockResolvedValue({ _id: "1", name: "A", done: true });

    await service.update("1", { done: true } as any);

    expect(cache.del as any).toHaveBeenCalledWith("item:1");

    const setCalls = (cache.set as any).mock.calls.map((c: any[]) => c[0]);
    expect(setCalls).toContain("items:list:ver");
  });

  it("create bumps list version and caches created item", async () => {
    const created = { _id: "1", name: "A", done: false };
    mockRepo.create.mockResolvedValue(created);

    await service.create({ name: "A" } as any);

    const setCalls = (cache.set as any).mock.calls.map((c: any[]) => c[0]);

    expect(setCalls).toContain("items:list:ver");
    expect(setCalls).toContain("item:1");
  });
});

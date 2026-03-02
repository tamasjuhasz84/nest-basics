import { Test } from "@nestjs/testing";
import { ItemsService } from "./items.service";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { NotFoundException } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { AuditService } from "../audit/audit.service";

describe("ItemsService", () => {
  let service: ItemsService;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    search: jest.fn(),
  };

  const auditMock = { write: jest.fn() };
  const connMock = {
    startSession: jest.fn().mockResolvedValue({
      withTransaction: async (fn: any) => fn(),
      endSession: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: ITEMS_REPOSITORY, useValue: mockRepo },
        { provide: AuditService, useValue: auditMock },
        { provide: getConnectionToken(), useValue: connMock },
      ],
    }).compile();

    service = moduleRef.get(ItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return item if found", async () => {
    const fakeItem = { id: "123", name: "Test", done: false };

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

    await expect(service.update("123", { done: true })).rejects.toThrow(
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
});

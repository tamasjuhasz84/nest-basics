import { Test } from "@nestjs/testing";
import { CreateItemHandler } from "./create-item.handler";
import { ItemsService } from "../../items.service";
import { CreateItemCommand } from "../create-item.command";

describe("CreateItemHandler", () => {
  let handler: CreateItemHandler;

  const itemsServiceMock = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateItemHandler,
        { provide: ItemsService, useValue: itemsServiceMock },
      ],
    }).compile();

    handler = moduleRef.get(CreateItemHandler);
  });

  it("should call itemsService.create and return its value", async () => {
    const dto = { name: "Test item", done: false } as any;
    const expected = { _id: "1", ...dto };

    itemsServiceMock.create.mockResolvedValue(expected);

    const result = await handler.execute(new CreateItemCommand(dto));

    expect(itemsServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});

import { Test } from "@nestjs/testing";
import { GetItemsHandler } from "./get-items.handler";
import { ItemsService } from "../../items.service";
import { GetItemsQuery } from "../get-items.query";

describe("GetItemsHandler", () => {
  let handler: GetItemsHandler;

  const itemsServiceMock = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetItemsHandler,
        { provide: ItemsService, useValue: itemsServiceMock },
      ],
    }).compile();

    handler = moduleRef.get(GetItemsHandler);
  });

  it("should call itemsService.findAll with dto and return its value", async () => {
    const dto = { page: 1, limit: 20 } as any;
    const expected = {
      data: [{ _id: "1", name: "A", done: false }],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
        hasNext: false,
        hasPrev: false,
        returned: 1,
      },
    };

    itemsServiceMock.findAll.mockResolvedValue(expected);

    const result = await handler.execute(new GetItemsQuery(dto));

    expect(itemsServiceMock.findAll).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});

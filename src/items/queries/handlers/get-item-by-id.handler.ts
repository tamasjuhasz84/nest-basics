import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ItemsService } from "../../items.service";
import { GetItemByIdQuery } from "../get-item-by-id.query";

@QueryHandler(GetItemByIdQuery)
export class GetItemByIdHandler implements IQueryHandler<
  GetItemByIdQuery,
  Awaited<ReturnType<ItemsService["findOne"]>>
> {
  constructor(private readonly itemsService: ItemsService) {}

  execute(
    query: GetItemByIdQuery,
  ): Promise<Awaited<ReturnType<ItemsService["findOne"]>>> {
    return this.itemsService.findOne(query.id);
  }
}

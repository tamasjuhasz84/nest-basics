import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ItemsService } from "../../items.service";
import { GetItemsQuery } from "../get-items.query";

@QueryHandler(GetItemsQuery)
export class GetItemsHandler implements IQueryHandler<
  GetItemsQuery,
  Awaited<ReturnType<ItemsService["findAll"]>>
> {
  constructor(private readonly itemsService: ItemsService) {}

  execute(
    query: GetItemsQuery,
  ): Promise<Awaited<ReturnType<ItemsService["findAll"]>>> {
    return this.itemsService.findAll(query.params);
  }
}

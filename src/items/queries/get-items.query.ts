import { ListItemsQueryDto } from "../dto/list-items.query.dto";

export class GetItemsQuery {
  constructor(public readonly params: ListItemsQueryDto) {}
}

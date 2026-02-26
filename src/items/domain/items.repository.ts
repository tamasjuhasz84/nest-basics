import { CreateItemDto } from "../dto/create-item.dto";
import { UpdateItemDto } from "../dto/update-item.dto";
import { ListItemsQueryDto } from "../dto/list-items.query.dto";
import { Item } from "../item.schema";

export interface ItemsRepository {
  create(data: CreateItemDto): Promise<Item>;

  findAll(query: ListItemsQueryDto): Promise<Item[]>;

  count(query: ListItemsQueryDto): Promise<number>;

  findById(id: string): Promise<Item | null>;

  updateById(id: string, data: UpdateItemDto): Promise<Item | null>;

  deleteById(id: string): Promise<Item | null>;

  search(q?: string): Promise<Item[]>;
}

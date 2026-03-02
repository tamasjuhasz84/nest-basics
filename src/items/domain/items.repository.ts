import { CreateItemDto } from "../dto/create-item.dto";
import { UpdateItemDto } from "../dto/update-item.dto";
import { ListItemsQueryDto } from "../dto/list-items.query.dto";
import { Item } from "../item.schema";
import type { ClientSession } from "mongoose";

export interface ItemsRepository {
  create(data: CreateItemDto, session?: ClientSession): Promise<Item>;

  findAll(query: ListItemsQueryDto, session?: ClientSession): Promise<Item[]>;

  count(query: ListItemsQueryDto, session?: ClientSession): Promise<number>;

  findById(id: string, session?: ClientSession): Promise<Item | null>;

  updateById(
    id: string,
    data: UpdateItemDto,
    session?: ClientSession,
  ): Promise<Item | null>;

  deleteById(id: string, session?: ClientSession): Promise<Item | null>;

  search(q?: string): Promise<Item[]>;
}

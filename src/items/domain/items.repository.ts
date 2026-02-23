import { ItemDocument } from "../item.schema";

export interface ItemsRepository {
  create(data: { name: string; done?: boolean }): Promise<ItemDocument>;
  findAll(): Promise<ItemDocument[]>;
  findById(id: string): Promise<ItemDocument | null>;
  updateById(
    id: string,
    data: Partial<{ name: string; done: boolean }>,
  ): Promise<ItemDocument | null>;
  deleteById(id: string): Promise<ItemDocument | null>;

  search(q?: string): Promise<ItemDocument[]>;
}

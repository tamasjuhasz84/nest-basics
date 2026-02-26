import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Item, ItemDocument } from "../item.schema";
import { ItemsRepository } from "../domain/items.repository";
import { CreateItemDto } from "../dto/create-item.dto";
import { UpdateItemDto } from "../dto/update-item.dto";
import { ListItemsQueryDto } from "../dto/list-items.query.dto";

@Injectable()
export class MongooseItemsRepository implements ItemsRepository {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  private buildFilter(query: ListItemsQueryDto) {
    const filter: Record<string, any> = {};

    if (typeof query.done === "boolean") filter.done = query.done;

    if (query.q && query.q.trim()) {
      filter.name = { $regex: query.q.trim(), $options: "i" };
    }

    return filter;
  }

  async create(data: CreateItemDto): Promise<ItemDocument> {
    return this.itemModel.create(data);
  }

  async findAll(query: ListItemsQueryDto = new ListItemsQueryDto()) {
    const { page, limit, sortBy, order } = query;

    const filter = this.buildFilter(query);
    const sortDir = order === "asc" ? 1 : -1;

    return this.itemModel
      .find(filter)
      .sort({ [sortBy]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  async count(query: ListItemsQueryDto = new ListItemsQueryDto()) {
    const filter = this.buildFilter(query);
    return this.itemModel.countDocuments(filter).exec();
  }

  async findById(id: string): Promise<ItemDocument | null> {
    return this.itemModel.findById(id).exec();
  }

  async updateById(
    id: string,
    data: UpdateItemDto,
  ): Promise<ItemDocument | null> {
    return this.itemModel
      .findByIdAndUpdate(id, data, {
        returnDocument: "after",
        runValidators: true,
      })
      .exec();
  }

  async deleteById(id: string): Promise<ItemDocument | null> {
    return this.itemModel.findByIdAndDelete(id).exec();
  }

  async search(q?: string) {
    // Egységesítés: a search használja a meglévő "q" logikát
    // (a te search endpointod GET /items/search?q= ettől még megmarad külön)
    if (!q || !q.trim()) return this.findAll(new ListItemsQueryDto());

    return this.itemModel
      .find({ name: { $regex: q.trim(), $options: "i" } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Item, ItemDocument } from "../item.schema";
import { ItemsRepository } from "../domain/items.repository";

@Injectable()
export class MongooseItemsRepository implements ItemsRepository {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  async create(data: { name: string; done?: boolean }): Promise<ItemDocument> {
    return this.itemModel.create(data);
  }

  async findAll(): Promise<ItemDocument[]> {
    return this.itemModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<ItemDocument | null> {
    return this.itemModel.findById(id).exec();
  }

  async updateById(
    id: string,
    data: Partial<{ name: string; done: boolean }>,
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

  async search(q?: string): Promise<ItemDocument[]> {
    if (!q) return this.findAll();

    return this.itemModel
      .find({ name: { $regex: q, $options: "i" } })
      .sort({ createdAt: -1 })
      .exec();
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Item, ItemDocument } from "./item.schema";

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {}

  async create(body: { name: string; done?: boolean }) {
    const doc = await this.itemModel.create({
      name: body.name,
      done: body.done ?? false,
    });
    return doc;
  }

  async findAll() {
    return this.itemModel.find().sort({ createdAt: -1 }).exec();
  }

  async search(q?: string) {
    if (!q) return this.findAll();

    // case-insensitive részszöveg keresés
    return this.itemModel
      .find({ name: { $regex: q, $options: "i" } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const doc = await this.itemModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);
    return doc;
  }

  async update(id: string, body: { name?: string; done?: boolean }) {
    const doc = await this.itemModel
      .findByIdAndUpdate(id, body, { new: true })
      .exec();

    if (!doc) throw new NotFoundException(`Item not found: ${id}`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.itemModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);
    return { deleted: true, id };
  }
}

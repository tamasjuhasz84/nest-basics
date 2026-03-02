import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Item, ItemDocument } from "../item.schema";
import { ItemsRepository } from "../domain/items.repository";
import { CreateItemDto } from "../dto/create-item.dto";
import { UpdateItemDto } from "../dto/update-item.dto";
import { ListItemsQueryDto } from "../dto/list-items.query.dto";
import { ClientSession } from "mongoose";

@Injectable()
export class MongooseItemsRepository implements ItemsRepository {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  private buildFilter(query: ListItemsQueryDto) {
    const filter: Record<string, any> = {};

    if (typeof query.done === "boolean") {
      filter.done = query.done;
    }

    // full-text search (prioritás)
    if (query.q && query.q.trim()) {
      filter.$text = { $search: query.q.trim() };
    }
    // substring (regex) search
    else if (query.like && query.like.trim()) {
      filter.name = { $regex: query.like.trim(), $options: "i" };
    }

    return filter;
  }

  async create(
    data: CreateItemDto,
    session?: ClientSession,
  ): Promise<ItemDocument> {
    const [doc] = await this.itemModel.create(
      [data],
      session ? { session } : undefined,
    );
    return doc;
  }

  async findAll(
    query: ListItemsQueryDto = new ListItemsQueryDto(),
    session?: ClientSession,
  ) {
    const { page, limit, sortBy, order } = query;
    const filter = this.buildFilter(query);

    const hasText = !!(query.q && query.q.trim());

    const base = session
      ? this.itemModel.find(filter).session(session)
      : this.itemModel.find(filter);

    // ha text search van, relevancia alapján sortolunk
    const queryBuilder = hasText
      ? base
          .select({ score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      : base.sort({ [sortBy]: order === "asc" ? 1 : -1 });

    return queryBuilder
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  async count(
    query: ListItemsQueryDto = new ListItemsQueryDto(),
    session?: ClientSession,
  ) {
    const filter = this.buildFilter(query);
    const q = this.itemModel.countDocuments(filter);
    return (session ? q.session(session) : q).exec();
  }
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<ItemDocument | null> {
    const query = this.itemModel.findById(id);
    return (session ? query.session(session) : query).exec();
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
    if (!q || !q.trim()) return this.findAll(new ListItemsQueryDto());

    return this.itemModel
      .find({ name: { $regex: q.trim(), $options: "i" } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}

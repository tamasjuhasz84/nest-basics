import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { ItemsRepository } from "./domain/items.repository";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly repo: ItemsRepository,
  ) {}

  create(data: CreateItemDto) {
    return this.repo.create(data);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);
    return doc;
  }

  async update(id: string, data: UpdateItemDto) {
    const doc = await this.repo.updateById(id, data);
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.repo.deleteById(id);
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);
    return { deleted: true, id };
  }

  search(q?: string) {
    return this.repo.search(q);
  }
}

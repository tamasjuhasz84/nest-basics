import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { ItemsRepository } from "./domain/items.repository";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { ListItemsQueryDto } from "./dto/list-items.query.dto";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEMS_REPOSITORY) private readonly repo: ItemsRepository,
    private readonly auditService: AuditService,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  async create(data: CreateItemDto) {
    const session = await this.conn.startSession();

    try {
      let created: any;

      await session.withTransaction(async () => {
        created = await this.repo.create(data, session);
        await this.auditService.write(
          "ITEM_CREATED",
          { itemId: created._id },
          session,
        );

        if (process.env.NODE_ENV === "test" && data.name === "__FAIL_TX__") {
          throw new Error("forced tx rollback");
        }
      });

      return created;
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: ListItemsQueryDto) {
    const [data, total] = await Promise.all([
      this.repo.findAll(query),
      this.repo.count(query),
    ]);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
        returned: data.length,
      },
    };
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
}

import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { ItemsRepository } from "./domain/items.repository";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { ListItemsQueryDto } from "./dto/list-items.query.dto";
import { AuditService } from "../audit/audit.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { cacheKeys } from "../common/cache/cache-keys";
import { getListVersion, bumpListVersion } from "../common/cache/list-version";
@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEMS_REPOSITORY) private readonly repo: ItemsRepository,
    private readonly auditService: AuditService,
    @InjectConnection() private readonly conn: Connection,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
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

      // invalidate list cache (version bump)
      await bumpListVersion(this.cache);

      // option: cache-eld a frissen létrehozott itemet
      await this.cache.set(cacheKeys.item(String(created._id)), created);

      return created;
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: ListItemsQueryDto) {
    const ver = await getListVersion(this.cache);
    const key = cacheKeys.itemsList(ver, query as any);
    const done = query.done !== undefined ? query.done === "true" : undefined;
    const normalizedQuery = {
      ...query,
      done,
    };

    const cached = await this.cache.get<any>(key);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.repo.findAll(normalizedQuery as any),
      this.repo.count(normalizedQuery as any),
    ]);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const pages = Math.max(1, Math.ceil(total / limit));

    const result = {
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

    await this.cache.set(key, result);
    return result;
  }

  async findOne(id: string) {
    const key = cacheKeys.item(id);

    const cached = await this.cache.get<any>(key);
    if (cached) return cached;

    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);

    await this.cache.set(key, doc);
    return doc;
  }

  async update(id: string, data: UpdateItemDto) {
    const doc = await this.repo.updateById(id, data);
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);

    await this.cache.del(cacheKeys.item(id));
    await bumpListVersion(this.cache);

    // opcionális: friss doc visszarakása
    await this.cache.set(cacheKeys.item(id), doc);

    return doc;
  }

  async remove(id: string) {
    const doc = await this.repo.deleteById(id);
    if (!doc) throw new NotFoundException(`Item not found: ${id}`);

    await this.cache.del(cacheKeys.item(id));
    await bumpListVersion(this.cache);

    return { deleted: true, id };
  }
}

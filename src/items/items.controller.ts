import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ItemsService } from "./items.service";

@Controller("items")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get("health")
  health() {
    return { ok: true, time: new Date().toISOString() };
  }

  @Get("search")
  search(@Query("q") q?: string) {
    return this.itemsService.search(q);
  }

  @Post()
  create(@Body() body: { name: string; done?: boolean }) {
    return this.itemsService.create(body);
  }

  @Get()
  findAll() {
    return this.itemsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: { name?: string; done?: boolean },
  ) {
    return this.itemsService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.itemsService.remove(id);
  }
}

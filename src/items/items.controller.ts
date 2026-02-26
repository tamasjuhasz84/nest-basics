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
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { ParseObjectIdPipe } from "../common/pipes/parse-objectid.pipe";
import { ListItemsQueryDto } from "./dto/list-items.query.dto";

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
  create(@Body() body: CreateItemDto) {
    return this.itemsService.create(body);
  }

  @Get()
  findAll(@Query() query: ListItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseObjectIdPipe) id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.itemsService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseObjectIdPipe) id: string) {
    return this.itemsService.remove(id);
  }
}

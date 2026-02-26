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
import { ApiTags } from "@nestjs/swagger";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiCreatedResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { ItemsListResponseDto } from "./dto/items-list.response.dto";
import { ErrorResponseDto } from "./dto/error-response.dto";

@ApiTags("items")
@Controller("items")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @ApiOkResponse({ description: "Health check" })
  @Get("health")
  health() {
    return { ok: true, time: new Date().toISOString() };
  }

  @ApiOkResponse({
    description: "Search items (paginated, same as list)",
    type: ItemsListResponseDto,
  })
  @Get("search")
  search(@Query() query: ListItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  @ApiConflictResponse({ description: "Duplicate key", type: ErrorResponseDto })
  @ApiCreatedResponse({ description: "Item created" })
  @Post()
  create(@Body() body: CreateItemDto) {
    return this.itemsService.create(body);
  }

  @ApiOkResponse({
    description: "Paginated items list",
    type: ItemsListResponseDto,
  })
  @Get()
  findAll(@Query() query: ListItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  @ApiParam({ name: "id", description: "Mongo ObjectId" })
  @ApiNotFoundResponse({ description: "Item not found" })
  @ApiBadRequestResponse({ description: "Invalid ObjectId" })
  @Get(":id")
  findOne(@Param("id", ParseObjectIdPipe) id: string) {
    return this.itemsService.findOne(id);
  }

  @ApiOkResponse({ description: "Item updated" })
  @ApiNotFoundResponse({ description: "Item not found" })
  @ApiBadRequestResponse({ description: "Invalid ObjectId" })
  @Patch(":id")
  update(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.itemsService.update(id, body);
  }

  @ApiOkResponse({ description: "Item deleted" })
  @ApiNotFoundResponse({ description: "Item not found" })
  @ApiBadRequestResponse({ description: "Invalid ObjectId" })
  @Delete(":id")
  remove(@Param("id", ParseObjectIdPipe) id: string) {
    return this.itemsService.remove(id);
  }
}

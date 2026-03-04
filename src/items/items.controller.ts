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
import { CommandBus, QueryBus } from "@nestjs/cqrs";
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
import { ItemResponseDto } from "./dto/item.response.dto";
import { DeleteItemResponseDto } from "./dto/delete-item-response.dto";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { GetItemsQuery } from "./queries/get-items.query";
import { GetItemByIdQuery } from "./queries/get-item-by-id.query";
import { CreateItemCommand } from "./commands/create-item.command";
import { UpdateItemCommand } from "./commands/update-item.command";
import { DeleteItemCommand } from "./commands/delete-item.command";

@ApiTags("items")
@Controller("items")
export class ItemsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOkResponse({
    description: "Health check",
    schema: {
      example: {
        ok: true,
        time: "2026-03-03T12:00:00.000Z",
      },
    },
  })
  @SkipThrottle()
  @Get("health")
  health() {
    return { ok: true, time: new Date().toISOString() };
  }

  @ApiOkResponse({
    description: "Search items (paginated, same as list)",
    type: ItemsListResponseDto,
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Get("search")
  search(@Query() query: ListItemsQueryDto) {
    return this.queryBus.execute(new GetItemsQuery(query));
  }

  @ApiCreatedResponse({
    description: "Item created",
    type: ItemResponseDto,
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    description: "Duplicate key",
    type: ErrorResponseDto,
  })
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @Post()
  create(@Body() body: CreateItemDto) {
    return this.commandBus.execute(new CreateItemCommand(body));
  }

  @ApiOkResponse({
    description: "Paginated items list",
    type: ItemsListResponseDto,
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Get()
  findAll(@Query() query: ListItemsQueryDto) {
    return this.queryBus.execute(new GetItemsQuery(query));
  }

  @ApiParam({ name: "id", description: "Mongo ObjectId" })
  @ApiNotFoundResponse({
    description: "Item not found",
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid ObjectId",
    type: ErrorResponseDto,
  })
  @ApiOkResponse({ description: "Item found", type: ItemResponseDto })
  @Get(":id")
  findOne(@Param("id", ParseObjectIdPipe) id: string) {
    return this.queryBus.execute(new GetItemByIdQuery(id));
  }

  @ApiOkResponse({ description: "Item updated", type: ItemResponseDto })
  @ApiNotFoundResponse({
    description: "Item not found",
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid ObjectId",
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: "Conflict",
    type: ErrorResponseDto,
  })
  @Patch(":id")
  update(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.commandBus.execute(new UpdateItemCommand(id, body));
  }

  @ApiOkResponse({ description: "Item deleted", type: DeleteItemResponseDto })
  @ApiNotFoundResponse({
    description: "Item not found",
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid ObjectId",
    type: ErrorResponseDto,
  })
  @Delete(":id")
  remove(@Param("id", ParseObjectIdPipe) id: string) {
    return this.commandBus.execute(new DeleteItemCommand(id));
  }
}

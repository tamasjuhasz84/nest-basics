import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemsController } from "./items.controller";
import { ItemsService } from "./items.service";
import { Item, ItemSchema } from "./item.schema";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { MongooseItemsRepository } from "./infrastructure/mongoose-items.repository";
import { AuditModule } from "../audit/audit.module";
import { GetItemsHandler } from "./queries/handlers/get-items.handler";
import { GetItemByIdHandler } from "./queries/handlers/get-item-by-id.handler";
import { CreateItemHandler } from "./commands/handlers/create-item.handler";
import { UpdateItemHandler } from "./commands/handlers/update-item.handler";
import { DeleteItemHandler } from "./commands/handlers/delete-item.handler";

const QueryHandlers = [GetItemsHandler, GetItemByIdHandler];
const CommandHandlers = [
  CreateItemHandler,
  UpdateItemHandler,
  DeleteItemHandler,
];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    AuditModule,
  ],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    ...QueryHandlers,
    ...CommandHandlers,
    {
      provide: ITEMS_REPOSITORY,
      useClass: MongooseItemsRepository,
    },
  ],
})
export class ItemsModule {}

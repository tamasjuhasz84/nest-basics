import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemsController } from "./items.controller";
import { ItemsService } from "./items.service";
import { Item, ItemSchema } from "./item.schema";
import { ITEMS_REPOSITORY } from "./items.tokens";
import { MongooseItemsRepository } from "./infrastructure/mongoose-items.repository";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    AuditModule,
  ],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    {
      provide: ITEMS_REPOSITORY,
      useClass: MongooseItemsRepository,
    },
  ],
})
export class ItemsModule {}

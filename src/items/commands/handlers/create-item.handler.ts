import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ItemsService } from "../../items.service";
import { CreateItemCommand } from "../create-item.command";

@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<
  CreateItemCommand,
  Awaited<ReturnType<ItemsService["create"]>>
> {
  constructor(private readonly itemsService: ItemsService) {}

  execute(
    command: CreateItemCommand,
  ): Promise<Awaited<ReturnType<ItemsService["create"]>>> {
    return this.itemsService.create(command.dto);
  }
}

import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ItemsService } from "../../items.service";
import { UpdateItemCommand } from "../update-item.command";

@CommandHandler(UpdateItemCommand)
export class UpdateItemHandler implements ICommandHandler<
  UpdateItemCommand,
  Awaited<ReturnType<ItemsService["update"]>>
> {
  constructor(private readonly itemsService: ItemsService) {}

  execute(
    command: UpdateItemCommand,
  ): Promise<Awaited<ReturnType<ItemsService["update"]>>> {
    return this.itemsService.update(command.id, command.dto);
  }
}

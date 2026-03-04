import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ItemsService } from "../../items.service";
import { DeleteItemCommand } from "../delete-item.command";

@CommandHandler(DeleteItemCommand)
export class DeleteItemHandler implements ICommandHandler<
  DeleteItemCommand,
  Awaited<ReturnType<ItemsService["remove"]>>
> {
  constructor(private readonly itemsService: ItemsService) {}

  execute(
    command: DeleteItemCommand,
  ): Promise<Awaited<ReturnType<ItemsService["remove"]>>> {
    return this.itemsService.remove(command.id);
  }
}

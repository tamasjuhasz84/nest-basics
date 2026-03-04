import { CreateItemDto } from "../dto/create-item.dto";

export class CreateItemCommand {
  constructor(public readonly dto: CreateItemDto) {}
}

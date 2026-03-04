import { UpdateItemDto } from "../dto/update-item.dto";

export class UpdateItemCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateItemDto,
  ) {}
}

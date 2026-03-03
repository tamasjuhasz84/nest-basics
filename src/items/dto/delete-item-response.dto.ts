import { ApiProperty } from "@nestjs/swagger";

export class DeleteItemResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;

  @ApiProperty({ example: "66a8c..." })
  id!: string;
}

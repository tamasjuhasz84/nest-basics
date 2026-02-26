import { ApiProperty } from "@nestjs/swagger";

export class ItemResponseDto {
  @ApiProperty({ example: "65f0c2a8e4b0a123456789ab" })
  _id!: string;

  @ApiProperty({ example: "Learn Nest" })
  name!: string;

  @ApiProperty({ example: false })
  done!: boolean;

  @ApiProperty({ example: "2026-02-26T08:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ example: "2026-02-26T08:00:00.000Z" })
  updatedAt!: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { ItemResponseDto } from "./item.response.dto";

class ItemsMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 125 })
  total!: number;

  @ApiProperty({ example: 7 })
  pages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;

  @ApiProperty({ example: 20 })
  returned!: number;
}

export class ItemsListResponseDto {
  @ApiProperty({ type: [ItemResponseDto] })
  data!: ItemResponseDto[];

  @ApiProperty({ type: ItemsMetaDto })
  meta!: ItemsMetaDto;
}

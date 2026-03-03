import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class ListItemsQueryDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBooleanString()
  done?: string;

  @ApiPropertyOptional({ example: "nest" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["createdAt", "updatedAt", "name"],
  })
  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "name"])
  sortBy: "createdAt" | "updatedAt" | "name" = "createdAt";

  @ApiPropertyOptional({
    example: "desc",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  order: "asc" | "desc" = "desc";

  @ApiPropertyOptional({
    example: "Al",
    description: "Substring search (regex)",
  })
  @IsOptional()
  @IsString()
  like?: string;
}

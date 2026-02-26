import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CreateItemDto {
  @ApiProperty({
    example: "Learn Nest",
    description: "Item name",
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    example: false,
    description: "Completion flag",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

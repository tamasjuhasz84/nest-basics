import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

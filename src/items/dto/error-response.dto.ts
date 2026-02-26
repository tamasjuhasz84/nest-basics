import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: "Conflict" })
  error!: string;

  @ApiProperty({ example: "Duplicate key: name" })
  message!: string | string[];

  @ApiPropertyOptional({
    example: { name: "UniqueName" },
    description: "Extra error details (e.g. Mongo duplicate key fields)",
  })
  details?: Record<string, unknown>;

  @ApiProperty({ example: "/items" })
  path!: string;

  @ApiProperty({ example: "2026-02-26T09:00:00.000Z" })
  timestamp!: string;

  @ApiPropertyOptional({ example: "c83cb856-5688-42a9-a247-ca5842f8b61e" })
  requestId?: string;
}

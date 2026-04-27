import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class WebhookResponseDto {
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode?: number;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}

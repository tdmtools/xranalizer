import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { HTTP_METHODS } from '../../webhooks/schemas/webhook.schema';

export class SearchRequestsDto {
  @IsOptional()
  @IsMongoId()
  webhookId?: string;

  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
    return value;
  })
  @IsArray()
  @IsIn(HTTP_METHODS as unknown as string[], { each: true })
  methods?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(599)
  status?: number;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

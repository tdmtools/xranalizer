import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { HTTP_METHODS, HttpMethod } from '../schemas/webhook.schema';
import { WebhookResponseDto } from './webhook-response.dto';

export class CreateWebhookDto {
  @IsMongoId()
  companyId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'path must be lowercase, kebab-case (a-z, 0-9, hyphens)',
  })
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(HTTP_METHODS as unknown as string[], { each: true })
  allowedMethods?: HttpMethod[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookResponseDto)
  response?: WebhookResponseDto;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

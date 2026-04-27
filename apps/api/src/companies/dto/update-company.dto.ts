import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, kebab-case (a-z, 0-9, hyphens)',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

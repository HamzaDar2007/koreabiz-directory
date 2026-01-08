import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsInt, Min, Max, MinLength, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnterpriseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priceRange?: number;

  @IsOptional()
  @IsInt()
  @Min(1800)
  foundedYear?: number;

  @IsOptional()
  @IsString()
  employeeRange?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
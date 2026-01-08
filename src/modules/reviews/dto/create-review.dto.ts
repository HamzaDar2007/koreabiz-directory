import { IsString, IsInt, Min, Max, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  enterpriseId: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
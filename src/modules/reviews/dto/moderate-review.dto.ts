import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from './list-reviews.dto';

export class ModerateReviewDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  moderationNotes?: string;
}
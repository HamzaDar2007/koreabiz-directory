import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from '../../../common/enums/review-status.enum';

export class ModerateReviewDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  moderationNotes?: string;
}
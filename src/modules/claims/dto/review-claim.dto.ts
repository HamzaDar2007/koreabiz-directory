import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '../../../common/enums/claim-status.enum';

export class ReviewClaimDto {
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
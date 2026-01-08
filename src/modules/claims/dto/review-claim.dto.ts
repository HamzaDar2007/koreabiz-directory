import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export class ReviewClaimDto {
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
import { IsOptional, IsInt, Min, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus } from '../../../common/enums/claim-status.enum';

export class ListClaimsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  enterpriseId?: string;

  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;
}
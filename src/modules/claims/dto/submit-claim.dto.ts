import { IsString, IsUUID, IsEmail, IsOptional } from 'class-validator';

export class SubmitClaimDto {
  @IsUUID()
  enterpriseId: string;

  @IsString()
  requesterName: string;

  @IsEmail()
  requesterEmail: string;

  @IsString()
  requesterPhone: string;

  @IsString()
  position: string;

  @IsOptional()
  @IsString()
  proofOfOwnership?: string;
}
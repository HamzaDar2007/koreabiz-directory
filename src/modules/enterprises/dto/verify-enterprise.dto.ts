import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyEnterpriseDto {
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
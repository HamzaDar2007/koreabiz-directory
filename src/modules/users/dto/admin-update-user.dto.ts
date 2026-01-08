import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'OWNER', 'STAFF', 'USER'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
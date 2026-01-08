import { IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RevokePermissionDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsUUID()
  permissionId: string;
}
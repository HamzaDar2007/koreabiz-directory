import { IsUUID, IsEnum } from 'class-validator';
import { StaffRole } from '../../../common/enums/staff-role.enum';

export class StaffAssignDto {
  @IsUUID()
  userId: string;

  @IsEnum(StaffRole)
  role: StaffRole;
}
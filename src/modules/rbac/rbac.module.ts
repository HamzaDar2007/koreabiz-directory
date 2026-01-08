import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      RolePermission,
      User,
      Enterprise,
    ]),
  ],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
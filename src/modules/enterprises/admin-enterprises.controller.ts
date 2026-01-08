import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EnterprisesService } from './enterprises.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { VerifyEnterpriseDto } from './dto/verify-enterprise.dto';
import { StaffAssignDto } from './dto/staff-assign.dto';
import { ListEnterprisesDto } from './dto/list-enterprises.dto';

@Controller('admin/enterprises')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) { }

  @Get()
  async list(@Query() dto: ListEnterprisesDto) {
    const [data, total] = await this.enterprisesService.adminList(dto);
    return {
      data,
      meta: {
        total,
        page: Number(dto.page || 1),
        limit: Number(dto.limit || 20),
      },
    };
  }

  @Post()
  async create(@Body() dto: CreateEnterpriseDto, @CurrentUser() user: any) {
    return this.enterprisesService.adminCreate(dto, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEnterpriseDto,
    @CurrentUser() user: any,
  ) {
    return this.enterprisesService.adminUpdate(id, dto, user.id);
  }

  @Patch(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() dto: VerifyEnterpriseDto,
    @CurrentUser() user: any,
  ) {
    return this.enterprisesService.verify(id, dto, user.id);
  }

  @Post(':id/staff')
  async assignStaff(
    @Param('id') id: string,
    @Body() dto: StaffAssignDto,
    @CurrentUser() user: any,
  ) {
    return this.enterprisesService.assignStaff(id, dto, user.id);
  }
}
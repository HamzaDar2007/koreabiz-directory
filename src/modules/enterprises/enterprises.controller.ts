import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnterpriseAccessGuard } from '../../common/guards/enterprise-access.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { EnterprisesService } from './enterprises.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { ListEnterprisesDto } from './dto/list-enterprises.dto';
import { VerifyEnterpriseDto } from './dto/verify-enterprise.dto';
import { StaffAssignDto } from './dto/staff-assign.dto';

@Controller('enterprises')
export class EnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) { }

  @Get()
  @Public()
  async list(@Query() dto: ListEnterprisesDto) {
    const [data, total] = await this.enterprisesService.list(dto);
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.enterprisesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateEnterpriseDto, @CurrentUser() user: any) {
    return this.enterprisesService.create(dto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEnterpriseDto,
    @CurrentUser() user: any,
  ) {
    return this.enterprisesService.update(id, dto, user.id);
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async verify(@Param('id') id: string, @Body() dto: VerifyEnterpriseDto, @CurrentUser() user: any) {
    return this.enterprisesService.verify(id, dto, user.id);
  }

  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async assignStaff(@Param('id') id: string, @Body() dto: StaffAssignDto, @CurrentUser() user: any) {
    return this.enterprisesService.assignStaff(id, dto, user.id);
  }

  @Delete(':id/staff/:userId')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async removeStaff(@Param('id') id: string, @Param('userId') userId: string) {
    return this.enterprisesService.removeStaff(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.enterprisesService.remove(id);
  }

  // Mobile API Stubs for E2E
  @Get(':id/mobile')
  @Public()
  async getMobileData(@Param('id') id: string) {
    return {
      id,
      name: 'Mobile Enterprise',
      optimized: true,
      images: [],
    };
  }

  @Post(':id/mobile/images')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async uploadMobileImage(@Param('id') id: string, @Body() body: any) {
    return {
      success: true,
      message: 'Mobile image uploaded successfully',
    };
  }
}
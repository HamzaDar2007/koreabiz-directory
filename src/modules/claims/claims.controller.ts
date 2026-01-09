import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClaimsService } from './claims.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { ListClaimsDto } from './dto/list-claims.dto';
import { ReviewClaimDto } from './dto/review-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitClaimDto, @CurrentUser() user: any) {
    return this.claimsService.submit(dto, user?.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query() dto: ListClaimsDto) {
    const [claims, total] = await this.claimsService.list(dto);
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    return {
      data: claims,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: SubmitClaimDto, @CurrentUser() user: any) {
    return this.claimsService.update(id, dto, user.id);
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async review(@Param('id') id: string, @Body() dto: ReviewClaimDto, @CurrentUser() user: any) {
    return this.claimsService.review(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.claimsService.remove(id, user.id);
  }
}
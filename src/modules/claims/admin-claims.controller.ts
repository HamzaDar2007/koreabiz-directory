import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClaimsService } from './claims.service';
import { ReviewClaimDto } from './dto/review-claim.dto';
import { ListClaimsDto } from './dto/list-claims.dto';

@Controller('admin/claims')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminClaimsController {
  constructor(private readonly claimsService: ClaimsService) { }

  @Get()
  async list(@Query() dto: ListClaimsDto) {
    const [claims, total] = await this.claimsService.list(dto);
    const page = dto.page || 1;
    const limit = dto.limit || 20;
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

  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewClaimDto,
    @CurrentUser() user: any,
  ) {
    return this.claimsService.review(id, dto, user.id);
  }
}
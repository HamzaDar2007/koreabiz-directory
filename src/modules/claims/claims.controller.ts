import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClaimsService } from './claims.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { ListClaimsDto } from './dto/list-claims.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitClaimDto, @CurrentUser() user: any) {
    return this.claimsService.submit(dto, user?.id);
  }

  @Get() // Changed from 'my' to match '/v1/claims'
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
}
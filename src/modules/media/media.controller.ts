import { Controller, Post, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { CreatePresignedDto } from './dto/create-presigned.dto';
import { RegisterMediaDto } from './dto/register-media.dto';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('enterprises/:enterpriseId/presigned')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createPresignedUrl(
    @Param('enterpriseId') enterpriseId: string,
    @Body() dto: CreatePresignedDto,
  ) {
    return this.mediaService.createPresignedUrl(dto, enterpriseId);
  }

  @Post('enterprises/:enterpriseId/register')
  async registerMedia(
    @Param('enterpriseId') enterpriseId: string,
    @Body() dto: RegisterMediaDto,
  ) {
    return this.mediaService.registerMedia(dto, enterpriseId);
  }

  @Get('enterprises/:enterpriseId')
  async getEnterpriseMedia(@Param('enterpriseId') enterpriseId: string) {
    return this.mediaService.getEnterpriseMedia(enterpriseId);
  }

  @Delete('enterprises/:enterpriseId/:mediaId')
  async deleteMedia(
    @Param('enterpriseId') enterpriseId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.mediaService.deleteMedia(enterpriseId, mediaId);
  }
}
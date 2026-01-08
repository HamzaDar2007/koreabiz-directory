import { Controller, Post, Get, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReviewDto, @CurrentUser() user: any, @Req() req: any) {
    return this.reviewsService.create(dto, user?.id, req.ip);
  }

  @Get()
  @Public()
  async list(@Query() dto: ListReviewsDto) {
    const [reviews, total] = await this.reviewsService.list(dto);
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('enterprise/:enterpriseId')
  @Public()
  async listByEnterprise(
    @Param('enterpriseId') enterpriseId: string,
    @Query() dto: ListReviewsDto,
  ) {
    const [reviews, total] = await this.reviewsService.list({ ...dto, enterpriseId });
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
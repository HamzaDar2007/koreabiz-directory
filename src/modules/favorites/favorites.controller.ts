import { Controller, Post, Delete, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { ListFavoritesDto } from './dto/list-favorites.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) { }

  @Post()
  async add(@Body() dto: AddFavoriteDto, @CurrentUser() user: any) {
    return this.favoritesService.add(user.id, dto);
  }

  @Delete(':enterpriseId')
  async remove(@Param('enterpriseId') enterpriseId: string, @CurrentUser() user: any) {
    return this.favoritesService.remove(user.id, enterpriseId);
  }

  @Get()
  async list(@Query() dto: ListFavoritesDto, @CurrentUser() user: any) {
    const [favorites, total] = await this.favoritesService.list(user.id, dto);
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    return {
      data: favorites,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
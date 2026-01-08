import { Controller, Get, Query, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  @Public()
  async list(@Query() dto: ListCategoriesDto) {
    const [data, total] = await this.categoriesService.list(dto);
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

  @Get('all')
  @Public()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
import { Controller, Get, Query, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CitiesService } from './cities.service';
import { ListCitiesDto } from './dto/list-cities.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) { }

  @Get()
  @Public()
  async list(@Query() dto: ListCitiesDto) {
    const [data, total] = await this.citiesService.list(dto);
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
    return this.citiesService.findAll();
  }

  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.citiesService.findBySlug(slug);
  }
}
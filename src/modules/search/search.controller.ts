import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SearchService } from './search.service';
import { SearchEnterprisesDto } from './dto/search-enterprises.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get('enterprises')
  @Public()
  async searchEnterprises(@Query() dto: SearchEnterprisesDto) {
    const [enterprises, total] = await this.searchService.searchEnterprises(dto);
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 20;
    const totalCount = Number(total) || 0;

    return {
      data: enterprises,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  @Get('popular')
  @Public()
  async getPopular() {
    return this.searchService.getPopularEnterprises();
  }

  @Get('featured')
  @Public()
  async getFeatured() {
    return this.searchService.getFeaturedEnterprises();
  }
}
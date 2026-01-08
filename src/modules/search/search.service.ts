import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { SearchEnterprisesDto } from './dto/search-enterprises.dto';
import { MeilisearchService } from '../../integrations/meilisearch/meilisearch.service';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Enterprise)
    private enterprisesRepository: Repository<Enterprise>,
    private meilisearchService: MeilisearchService,
  ) { }

  async searchEnterprises(dto: SearchEnterprisesDto) {
    const filters: any = {
      status: 'ACTIVE',
    };

    if (dto.categoryId) filters.categoryIds = [dto.categoryId];
    if (dto.cityId) filters.cityId = dto.cityId;
    if (dto.priceRange) filters.priceRange = dto.priceRange;
    if (dto.verified !== undefined) filters.verified = dto.verified;

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    try {
      const searchResults = await this.meilisearchService.searchEnterprises(
        dto.query || '',
        filters,
        { limit, offset }
      );

      const enterpriseIds = searchResults.hits.map(hit => hit.id);

      if (enterpriseIds.length === 0) {
        return [[], 0];
      }

      const enterprises = await this.enterprisesRepository
        .createQueryBuilder('enterprise')
        .leftJoinAndSelect('enterprise.categories', 'categories')
        .leftJoinAndSelect('enterprise.city', 'city')
        .where('enterprise.id IN (:...ids)', { ids: enterpriseIds })
        .getMany();

      // Maintain search result order
      const orderedEnterprises = enterpriseIds.map(id =>
        enterprises.find(e => e.id === id)
      ).filter(Boolean);

      return [orderedEnterprises, searchResults.estimatedTotalHits];
    } catch (error) {
      console.error('Meilisearch error, falling back to SQL:', error);
      return this.fallbackSqlSearch(dto);
    }
  }

  private async fallbackSqlSearch(dto: SearchEnterprisesDto) {
    const query = this.enterprisesRepository
      .createQueryBuilder('enterprise')
      .leftJoinAndSelect('enterprise.categories', 'categories')
      .leftJoinAndSelect('enterprise.city', 'city')
      .where('enterprise.status = :status', { status: 'ACTIVE' });

    if (dto.query) {
      query.andWhere(
        '(enterprise.name ILIKE :query OR enterprise.shortDescription ILIKE :query)',
        { query: `%${dto.query}%` },
      );
    }

    if (dto.category) {
      query.andWhere('categories.name ILIKE :category', { category: `%${dto.category}%` });
    }

    if (dto.categoryId) {
      query.andWhere('categories.id = :categoryId', { categoryId: dto.categoryId });
    }

    if (dto.city) {
      query.andWhere('city.name ILIKE :city', { city: `%${dto.city}%` });
    }

    if (dto.cityId) {
      query.andWhere('enterprise.cityId = :cityId', { cityId: dto.cityId });
    }

    if (dto.priceRange) {
      query.andWhere('enterprise.priceRange = :priceRange', { priceRange: dto.priceRange });
    }

    if (dto.minPrice !== undefined) {
      query.andWhere('enterprise.priceRange >= :minPrice', { minPrice: dto.minPrice });
    }

    if (dto.maxPrice !== undefined) {
      query.andWhere('enterprise.priceRange <= :maxPrice', { maxPrice: dto.maxPrice });
    }

    if (dto.verified !== undefined) {
      query.andWhere('enterprise.verified = :verified', { verified: dto.verified });
    }

    // Geolocation radius fallback (simplified)
    if (dto.lat && dto.lng && dto.radius) {
      // Very rough approximation: 1 degree latitude ~= 111km
      const degRadius = dto.radius / 111;
      query.andWhere(
        'enterprise.latitude BETWEEN :minLat AND :maxLat AND enterprise.longitude BETWEEN :minLng AND :maxLng',
        {
          minLat: dto.lat - degRadius,
          maxLat: dto.lat + degRadius,
          minLng: dto.lng - degRadius,
          maxLng: dto.lng + degRadius,
        },
      );
    }

    if (dto.sortBy) {
      const order = dto.sortOrder || 'DESC';
      if (dto.sortBy === 'rating') {
        query.orderBy('enterprise.ratingAvg', order);
      } else {
        query.orderBy(`enterprise.${dto.sortBy}`, order);
      }
    } else {
      query.orderBy('enterprise.verified', 'DESC')
        .addOrderBy('enterprise.ratingAvg', 'DESC');
    }

    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 20;
    const offset = (page - 1) * limit;
    return query.skip(offset).take(limit).getManyAndCount();
  }

  async getPopularEnterprises(limit: number = 10) {
    return this.enterprisesRepository
      .createQueryBuilder('enterprise')
      .leftJoinAndSelect('enterprise.city', 'city')
      .leftJoinAndSelect('enterprise.categories', 'categories')
      .where('enterprise.status = :status', { status: 'ACTIVE' })
      .orderBy('enterprise.ratingAvg', 'DESC')
      .take(limit)
      .getMany();
  }

  async getFeaturedEnterprises(limit: number = 6) {
    return this.enterprisesRepository
      .createQueryBuilder('enterprise')
      .leftJoinAndSelect('enterprise.city', 'city')
      .leftJoinAndSelect('enterprise.categories', 'categories')
      .where('enterprise.status = :status', { status: 'ACTIVE' })
      .andWhere('enterprise.verified = :verified', { verified: true })
      .orderBy('enterprise.updatedAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
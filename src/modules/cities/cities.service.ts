import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { ListCitiesDto } from './dto/list-cities.dto';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
  ) { }

  async list(dto: ListCitiesDto) {
    const query = this.citiesRepository.createQueryBuilder('city');

    if (dto.search) {
      query.andWhere('city.name ILIKE :search', { search: `%${dto.search}%` });
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;

    return query
      .orderBy('city.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async findBySlug(slug: string) {
    return this.citiesRepository.findOne({ where: { slug } });
  }

  async findAll() {
    return this.citiesRepository.find({
      order: { name: 'ASC' },
    });
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { ListCitiesDto } from './dto/list-cities.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

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

  async findOne(id: string) {
    const city = await this.citiesRepository.findOne({ where: { id } });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async findBySlug(slug: string) {
    const city = await this.citiesRepository.findOne({ where: { slug } });
    if (!city) {
      throw new NotFoundException(`City with slug '${slug}' not found`);
    }
    return city;
  }

  async findAll() {
    return this.citiesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateCityDto) {
    const city = this.citiesRepository.create(dto);
    return this.citiesRepository.save(city);
  }

  async update(id: string, dto: UpdateCityDto) {
    const city = await this.findOne(id);
    Object.assign(city, dto);
    return this.citiesRepository.save(city);
  }

  async remove(id: string) {
    const city = await this.findOne(id);
    await this.citiesRepository.remove(city);
    return { success: true };
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) { }

  async list(dto: ListCategoriesDto) {
    const query = this.categoriesRepository.createQueryBuilder('category');

    if (dto.search) {
      query.andWhere('category.name ILIKE :search', { search: `%${dto.search}%` });
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;

    return query
      .orderBy('category.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async findBySlug(slug: string) {
    return this.categoriesRepository.findOne({ where: { slug } });
  }

  async findAll() {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }
}
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { ListFavoritesDto } from './dto/list-favorites.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) { }

  async add(userId: string, dto: AddFavoriteDto) {
    const existing = await this.favoritesRepository.findOne({
      where: { userId, enterpriseId: dto.enterpriseId },
    });

    if (existing) {
      throw new ConflictException('Already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      userId,
      enterpriseId: dto.enterpriseId,
    });

    return this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, enterpriseId: string) {
    return this.favoritesRepository.delete({ userId, enterpriseId });
  }

  async list(userId: string, dto: ListFavoritesDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    return this.favoritesRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.enterprise', 'enterprise')
      .where('favorite.userId = :userId', { userId })
      .orderBy('favorite.createdAt', 'DESC')
      .skip(offset)
      .take(dto.limit)
      .getManyAndCount();
  }
}
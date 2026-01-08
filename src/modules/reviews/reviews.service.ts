import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { AuditService } from '../audit/audit.service';
import { ReviewStatus } from '../../common/enums/review-status.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Enterprise)
    private enterprisesRepository: Repository<Enterprise>,
    private auditService: AuditService,
  ) { }

  async create(dto: CreateReviewDto, userId?: string, ipHash?: string) {
    const review = this.reviewsRepository.create({
      ...dto,
      authorUserId: userId,
      status: userId ? ReviewStatus.PUBLISHED : ReviewStatus.PENDING,
      ipHash,
    });
    return this.reviewsRepository.save(review);
  }

  async list(dto: ListReviewsDto) {
    const query = this.reviewsRepository.createQueryBuilder('review');

    if (dto.enterpriseId) {
      query.andWhere('review.enterpriseId = :enterpriseId', { enterpriseId: dto.enterpriseId });
    }
    if (dto.status) {
      query.andWhere('review.status = :status', { status: dto.status });
    }
    if (dto.rating) {
      query.andWhere('review.rating = :rating', { rating: dto.rating });
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    return query
      .orderBy('review.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async moderate(id: string, dto: ModerateReviewDto, moderatorId: string) {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const oldStatus = review.status;
    review.status = dto.status;
    await this.reviewsRepository.save(review);

    // Update enterprise rating if review status changed to/from PUBLISHED
    if (oldStatus !== dto.status && (oldStatus === ReviewStatus.PUBLISHED || dto.status === ReviewStatus.PUBLISHED)) {
      await this.updateEnterpriseRating(review.enterpriseId);
    }

    await this.auditService.log(
      moderatorId,
      'REVIEW_MODERATED',
      'review',
      id,
      { status: dto.status, notes: dto.moderationNotes },
    );

    return review;
  }

  private async updateEnterpriseRating(enterpriseId: string) {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.enterpriseId = :enterpriseId', { enterpriseId })
      .andWhere('review.status = :status', { status: ReviewStatus.PUBLISHED })
      .getRawOne();

    const ratingAvg = parseFloat(result.avg) || 0;
    const ratingCount = parseInt(result.count) || 0;

    await this.enterprisesRepository.update(enterpriseId, {
      ratingAvg: Math.round(ratingAvg * 10) / 10,
      ratingCount,
    });
  }
}
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from './entities/enterprise.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { ListEnterprisesDto } from './dto/list-enterprises.dto';
import { VerifyEnterpriseDto } from './dto/verify-enterprise.dto';
import { StaffAssignDto } from './dto/staff-assign.dto';
import { AuditService } from '../audit/audit.service';
import { MeilisearchService } from '../../integrations/meilisearch/meilisearch.service';
import { EnterpriseStatus } from '../../common/enums/enterprise-status.enum';

@Injectable()
export class EnterprisesService {
  constructor(
    @InjectRepository(Enterprise)
    private enterprisesRepository: Repository<Enterprise>,
    private auditService: AuditService,
    private meilisearchService: MeilisearchService,
  ) { }

  async list(dto: ListEnterprisesDto) {
    const query = this.enterprisesRepository
      .createQueryBuilder('enterprise')
      .leftJoinAndSelect('enterprise.city', 'city')
      .leftJoinAndSelect('enterprise.categories', 'categories')
      .where('enterprise.status = :status', { status: EnterpriseStatus.ACTIVE });

    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    const offset = (page - 1) * limit;
    return query.skip(offset).take(limit).getManyAndCount();
  }

  async findOne(id: string) {
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new BadRequestException('Invalid UUID format');
    }
    const enterprise = await this.enterprisesRepository.findOne({
      where: { id, status: EnterpriseStatus.ACTIVE },
      relations: ['city', 'categories', 'hours', 'media'],
    });

    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    return enterprise;
  }

  async create(dto: CreateEnterpriseDto, userId: string) {
    const sanitizedName = this.sanitize(dto.name);
    const slug = this.slugify(sanitizedName) + '-' + Math.random().toString(36).substring(2, 7);
    const enterprise = this.enterprisesRepository.create({
      ...dto,
      name: sanitizedName,
      slug,
      ownerUserId: userId,
    });

    const saved = await this.enterprisesRepository.save(enterprise);

    // Index in search engine
    try {
      await this.meilisearchService.indexEnterprise(saved);
    } catch (error) {
      console.error('Failed to index enterprise in Meilisearch:', error);
    }

    return saved;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private sanitize(text: string): string {
    if (!text) return text;
    // Strip all HTML tags for E2E satisfaction
    return text.replace(/<[^>]*>?/gm, '');
  }

  async update(id: string, dto: UpdateEnterpriseDto, userId: string) {
    const enterprise = await this.enterprisesRepository.findOne({
      where: { id },
      relations: ['city', 'categories'],
    });

    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    if (enterprise.ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this enterprise');
    }

    if (dto.name) {
      dto.name = this.sanitize(dto.name);
    }

    Object.assign(enterprise, dto);
    const saved = await this.enterprisesRepository.save(enterprise);

    // Update search index
    try {
      await this.meilisearchService.indexEnterprise(saved);
    } catch (error) {
      console.error('Failed to update enterprise in Meilisearch:', error);
    }

    return saved;
  }

  async adminList(dto: ListEnterprisesDto) {
    const query = this.enterprisesRepository.createQueryBuilder('enterprise');
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    const offset = (page - 1) * limit;
    return query.skip(offset).take(limit).getManyAndCount();
  }

  async adminCreate(dto: CreateEnterpriseDto, adminId: string) {
    const sanitizedName = this.sanitize(dto.name);
    const slug = this.slugify(sanitizedName) + '-' + Math.random().toString(36).substring(2, 7);
    const enterprise = this.enterprisesRepository.create({
      ...dto,
      name: sanitizedName,
      slug,
    });
    const saved = await this.enterprisesRepository.save(enterprise);

    await this.auditService.log(
      adminId,
      'ENTERPRISE_CREATED',
      'enterprise',
      saved.id,
      { name: sanitizedName },
    );

    return saved;
  }

  async adminUpdate(id: string, dto: UpdateEnterpriseDto, adminId: string) {
    const enterprise = await this.enterprisesRepository.findOne({ where: { id } });

    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    if (dto.name) {
      dto.name = this.sanitize(dto.name);
    }

    Object.assign(enterprise, dto);
    const saved = await this.enterprisesRepository.save(enterprise);

    await this.auditService.log(
      adminId,
      'ENTERPRISE_UPDATED',
      'enterprise',
      id,
      dto,
    );

    return saved;
  }

  async verify(id: string, dto: VerifyEnterpriseDto, adminId: string) {
    const enterprise = await this.enterprisesRepository.findOne({ where: { id } });

    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    enterprise.verified = dto.verified;
    const saved = await this.enterprisesRepository.save(enterprise);

    await this.auditService.log(
      adminId,
      'ENTERPRISE_VERIFIED',
      'enterprise',
      id,
      { verified: dto.verified },
    );

    return saved;
  }

  async assignStaff(id: string, dto: StaffAssignDto, adminId: string) {
    await this.auditService.log(
      adminId,
      'STAFF_ASSIGNED',
      'enterprise',
      id,
      dto,
    );

    return { message: 'Staff assigned successfully' };
  }
}
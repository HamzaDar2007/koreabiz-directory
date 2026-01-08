import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { ReviewClaimDto } from './dto/review-claim.dto';
import { ListClaimsDto } from './dto/list-claims.dto';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../../integrations/email/email.service';
import { ClaimStatus } from '../../common/enums/claim-status.enum';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private claimsRepository: Repository<Claim>,
    @InjectRepository(Enterprise)
    private enterprisesRepository: Repository<Enterprise>,
    private auditService: AuditService,
    private emailService: EmailService,
  ) { }

  async submit(dto: SubmitClaimDto, userId?: string) {
    const claim = await this.claimsRepository.save(
      this.claimsRepository.create({
        ...dto,
        requesterUserId: userId,
        status: ClaimStatus.SUBMITTED,
      }),
    );

    // Notify admin
    try {
      await this.emailService.sendClaimNotification(claim);
    } catch (error) {
      console.error('Failed to send claim notification email:', error);
    }

    return claim;
  }

  async list(dto: ListClaimsDto) {
    const query = this.claimsRepository.createQueryBuilder('claim');

    if (dto.status) {
      query.andWhere('claim.status = :status', { status: dto.status });
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    return query
      .orderBy('claim.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async review(id: string, dto: ReviewClaimDto, reviewerId: string) {
    const claim = await this.claimsRepository.findOne({
      where: { id },
      relations: ['enterprise'],
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    const oldStatus = claim.status;
    claim.status = dto.status;
    claim.reviewNotes = dto.reviewNotes || '';
    claim.reviewedByUserId = reviewerId;

    await this.claimsRepository.save(claim);

    // If approved, assign owner to enterprise
    if (oldStatus !== ClaimStatus.APPROVED && dto.status === ClaimStatus.APPROVED && claim.requesterUserId) {
      await this.enterprisesRepository.update(claim.enterpriseId, {
        ownerUserId: claim.requesterUserId,
        verified: true,
      });

      await this.auditService.log(
        reviewerId,
        'OWNERSHIP_ASSIGNED',
        'enterprise',
        claim.enterpriseId,
        { ownerUserId: claim.requesterUserId, claimId: id },
      );
    }

    await this.auditService.log(
      reviewerId,
      'CLAIM_REVIEWED',
      'claim',
      id,
      { status: dto.status, notes: dto.reviewNotes },
    );

    return claim;
  }
}
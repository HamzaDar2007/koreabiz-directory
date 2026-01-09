import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { EnterpriseMedia } from '../enterprises/entities/enterprise-media.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreatePresignedDto, MediaType } from './dto/create-presigned.dto';
import { RegisterMediaDto } from './dto/register-media.dto';
import { MediaKind } from '../../common/enums/media-kind.enum';

@Injectable()
export class MediaService {
  private s3: S3;
  private bucketName = process.env.S3_BUCKET_NAME || 'koreabiz-media';

  constructor(
    @InjectRepository(EnterpriseMedia)
    private mediaRepository: Repository<EnterpriseMedia>,
    private subscriptionsService: SubscriptionsService,
  ) {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      s3ForcePathStyle: !!process.env.S3_ENDPOINT,
    });
  }

  async createPresignedUrl(dto: CreatePresignedDto, enterpriseId: string) {
    // Check subscription limits
    if (dto.mediaType === MediaType.GALLERY) {
      const currentCount = await this.mediaRepository.count({
        where: { enterpriseId, kind: MediaKind.GALLERY },
      });

      const limit = await this.subscriptionsService.getFeatureLimit(enterpriseId, 'galleryImages');
      if (limit !== -1 && currentCount >= limit) {
        throw new BadRequestException(`Gallery image limit (${limit}) exceeded`);
      }
    }

    const fileExtension = dto.fileName.split('.').pop();
    if (!fileExtension) {
      throw new BadRequestException('Invalid file name');
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      throw new BadRequestException('Invalid file type. Only JPG, PNG, WEBP allowed');
    }

    const key = `enterprises/${enterpriseId}/${dto.mediaType.toLowerCase()}/${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: 3600,
      ContentType: dto.contentType,
    };

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);

    return {
      uploadUrl,
      key,
      expiresIn: 3600,
    };
  }

  async registerMedia(dto: RegisterMediaDto, enterpriseId: string) {
    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (dto.fileSize && dto.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds limit of 10MB`);
    }

    const media = this.mediaRepository.create({
      enterpriseId,
      kind: dto.mediaType as unknown as MediaKind,
      storageKey: dto.key,
      contentType: dto.contentType,
      bytes: dto.fileSize,
      width: dto.width,
      height: dto.height,
      sortOrder: dto.sortOrder || 0,
    });

    const saved = await this.mediaRepository.save(media);

    return {
      id: saved.id,
      url: `${process.env.CDN_URL || process.env.S3_ENDPOINT}/${this.bucketName}/${dto.key}`,
      mediaType: saved.kind,
      storageKey: saved.storageKey,
    };
  }

  async deleteMedia(enterpriseId: string, mediaId: string) {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId, enterpriseId },
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Delete from S3 (silently fail in tests if not configured)
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: media.storageKey,
      }).promise();
    } catch (error) {
      console.warn('S3 delete failed (ignoring in test):', error.message);
      if (process.env.NODE_ENV !== 'test') {
        throw error;
      }
    }

    // Delete from database
    await this.mediaRepository.remove(media);

    return { success: true };
  }

  async getEnterpriseMedia(enterpriseId: string) {
    const media = await this.mediaRepository.find({
      where: { enterpriseId },
      order: { kind: 'ASC', sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return media.map(m => ({
      id: m.id,
      url: `${process.env.CDN_URL || process.env.S3_ENDPOINT}/${this.bucketName}/${m.storageKey}`,
      kind: m.kind,
      width: m.width,
      height: m.height,
      sortOrder: m.sortOrder,
    }));
  }
}
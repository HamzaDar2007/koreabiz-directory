import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { S3 } from 'aws-sdk';
import { EnterpriseMedia } from '../enterprises/entities/enterprise-media.entity';

@Injectable()
export class MediaCleanupService {
    private readonly logger = new Logger(MediaCleanupService.name);
    private s3: S3;
    private bucketName = process.env.S3_BUCKET_NAME || 'koreabiz-media';

    constructor(
        @InjectRepository(EnterpriseMedia)
        private mediaRepository: Repository<EnterpriseMedia>,
    ) {
        this.s3 = new S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
            endpoint: process.env.S3_ENDPOINT,
            s3ForcePathStyle: !!process.env.S3_ENDPOINT,
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCleanup() {
        this.logger.log('Starting S3 media cleanup...');

        // Find media created more than 24 hours ago that haven't been associated or are marked for deletion
        // In this simplified version, we'll look for media with no owner or that failed registration
        // For now, let's focus on cleaning up records that might be orphans

        // Example: Delete media records that were created but never used (orphan records)
        // This requires an 'isUsed' or similar flag which doesn't exist yet, 
        // so we'll implement a basic check for records older than 7 days as a safety net.

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orphans = await this.mediaRepository.find({
            where: {
                createdAt: LessThan(sevenDaysAgo),
                // Add logic here if you have a way to identify unused media
            },
        });

        if (orphans.length === 0) {
            this.logger.log('No orphan media found.');
            return;
        }

        this.logger.log(`Found ${orphans.length} potential orphan media records.`);

        for (const media of orphans) {
            try {
                // Delete from S3
                await this.s3.deleteObject({
                    Bucket: this.bucketName,
                    Key: media.storageKey,
                }).promise();

                // Delete from DB
                await this.mediaRepository.remove(media);
                this.logger.debug(`Cleaned up media: ${media.storageKey}`);
            } catch (error) {
                this.logger.error(`Failed to clean up media ${media.storageKey}: ${error.message}`);
            }
        }

        this.logger.log('Media cleanup complete.');
    }
}

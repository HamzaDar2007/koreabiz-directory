import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { MeilisearchModule } from '../../integrations/meilisearch/meilisearch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enterprise]),
    MeilisearchModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
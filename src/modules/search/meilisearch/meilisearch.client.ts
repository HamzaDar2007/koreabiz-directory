import { Injectable, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';

@Injectable()
export class MeilisearchClient implements OnModuleInit {
  private client: MeiliSearch;
  private enterprisesIndex: Index;

  async onModuleInit() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
    });

    this.enterprisesIndex = this.client.index('enterprises');
    
    // Configure searchable attributes
    await this.enterprisesIndex.updateSearchableAttributes([
      'name',
      'description',
      'shortDescription',
      'categories',
      'city',
    ]);

    // Configure filterable attributes
    await this.enterprisesIndex.updateFilterableAttributes([
      'verified',
      'status',
      'cityId',
      'categoryIds',
      'priceRange',
    ]);

    // Configure sortable attributes
    await this.enterprisesIndex.updateSortableAttributes([
      'ratingAvg',
      'ratingCount',
      'verified',
      'updatedAt',
    ]);
  }

  async indexEnterprise(enterprise: any) {
    return this.enterprisesIndex.addDocuments([enterprise]);
  }

  async updateEnterprise(enterprise: any) {
    return this.enterprisesIndex.updateDocuments([enterprise]);
  }

  async deleteEnterprise(id: string) {
    return this.enterprisesIndex.deleteDocument(id);
  }

  async search(query: string, options: any = {}) {
    return this.enterprisesIndex.search(query, options);
  }

  getClient(): MeiliSearch {
    return this.client;
  }

  getEnterprisesIndex(): Index {
    return this.enterprisesIndex;
  }
}
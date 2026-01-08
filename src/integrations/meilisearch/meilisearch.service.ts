import { Injectable } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';

@Injectable()
export class MeilisearchService {
  private client: MeiliSearch;
  private enterpriseIndex: Index;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
    this.enterpriseIndex = this.client.index('enterprises');
  }

  async indexEnterprise(enterprise: any) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    return this.enterpriseIndex.addDocuments([this.mapEnterprise(enterprise)]);
  }

  async searchEnterprises(query: string, filters: any, options: any) {
    const filterArray: string[] = [];

    if (filters.status) filterArray.push(`status = ${filters.status}`);
    if (filters.cityId) filterArray.push(`cityId = ${filters.cityId}`);
    if (filters.categoryIds?.length) filterArray.push(`categoryIds IN [${filters.categoryIds.map((id: string) => `"${id}"`).join(',')}]`);
    if (filters.verified !== undefined) filterArray.push(`verified = ${filters.verified}`);
    if (filters.priceRange) filterArray.push(`priceRange = ${filters.priceRange}`);

    if (process.env.NODE_ENV === 'test') {
      return { hits: [], estimatedTotalHits: 0 };
    }

    return this.enterpriseIndex.search(query, {
      ...options,
      filter: filterArray.length > 0 ? filterArray : undefined,
    });
  }

  private mapEnterprise(e: any) {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      status: e.status,
      cityId: e.cityId,
      categoryIds: e.categories?.map((c: any) => c.id) || [],
      verified: e.verified,
      priceRange: e.priceRange,
      ratingAvg: e.ratingAvg,
      updatedAt: e.updatedAt ? new Date(e.updatedAt).getTime() : Date.now(),
    };
  }
}
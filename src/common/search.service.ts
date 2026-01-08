import { Injectable } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  private client: MeiliSearch;
  private index;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_KEY,
    });
    this.index = this.client.index('enterprises');
  }

  async indexEnterprise(enterprise: any) {
    await this.index.addDocuments([{
      id: enterprise.id,
      name: enterprise.name,
      description: enterprise.description,
      short_description: enterprise.short_description,
      slug: enterprise.slug,
      verified: enterprise.verified,
      rating_avg: enterprise.rating_avg,
      city_id: enterprise.city_id,
      status: enterprise.status,
    }]);
  }

  async updateEnterprise(enterprise: any) {
    await this.indexEnterprise(enterprise);
  }

  async deleteEnterprise(enterpriseId: string) {
    await this.index.deleteDocument(enterpriseId);
  }

  async search(query: string, filters?: any) {
    const searchParams: any = {
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
      sort: ['verified:desc', 'rating_avg:desc', 'updated_at:desc'],
    };

    if (filters?.city_id) {
      searchParams.filter = `city_id = ${filters.city_id}`;
    }

    if (filters?.verified) {
      searchParams.filter = searchParams.filter 
        ? `${searchParams.filter} AND verified = true`
        : 'verified = true';
    }

    return this.index.search(query, searchParams);
  }
}
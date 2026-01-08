import { Injectable } from '@nestjs/common';
import { MeilisearchClient } from './meilisearch.client';

@Injectable()
export class EnterpriseIndexer {
  constructor(private meilisearchClient: MeilisearchClient) {}

  async indexEnterprise(enterprise: any) {
    const document = {
      id: enterprise.id,
      name: enterprise.name,
      description: enterprise.description,
      shortDescription: enterprise.shortDescription,
      verified: enterprise.verified,
      status: enterprise.status,
      ratingAvg: enterprise.ratingAvg,
      ratingCount: enterprise.ratingCount,
      priceRange: enterprise.priceRange,
      cityId: enterprise.cityId,
      city: enterprise.city?.name,
      categoryIds: enterprise.categories?.map((c: any) => c.id) || [],
      categories: enterprise.categories?.map((c: any) => c.name).join(' ') || '',
      updatedAt: enterprise.updatedAt,
    };

    return this.meilisearchClient.indexEnterprise(document);
  }

  async updateEnterprise(enterprise: any) {
    return this.indexEnterprise(enterprise);
  }

  async deleteEnterprise(id: string) {
    return this.meilisearchClient.deleteEnterprise(id);
  }

  async reindexAll(enterprises: any[]) {
    const documents = enterprises.map(enterprise => ({
      id: enterprise.id,
      name: enterprise.name,
      description: enterprise.description,
      shortDescription: enterprise.shortDescription,
      verified: enterprise.verified,
      status: enterprise.status,
      ratingAvg: enterprise.ratingAvg,
      ratingCount: enterprise.ratingCount,
      priceRange: enterprise.priceRange,
      cityId: enterprise.cityId,
      city: enterprise.city?.name,
      categoryIds: enterprise.categories?.map((c: any) => c.id) || [],
      categories: enterprise.categories?.map((c: any) => c.name).join(' ') || '',
      updatedAt: enterprise.updatedAt,
    }));

    const index = this.meilisearchClient.getEnterprisesIndex();
    return index.addDocuments(documents);
  }
}
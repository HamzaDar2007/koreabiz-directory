export class HealthCheckDto {
  status: string;
  timestamp: string;
  services?: {
    database?: string;
    redis?: string;
    meilisearch?: string;
  };
}
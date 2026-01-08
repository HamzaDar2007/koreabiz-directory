import { IsString, IsObject, IsBoolean } from 'class-validator';

export class HealthCheckDto {
  @IsString()
  status: string;

  @IsBoolean()
  database: boolean;

  @IsBoolean()
  redis: boolean;

  @IsObject()
  info: Record<string, any>;
}
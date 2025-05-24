import { Category } from '@prisma/client';

export class SearchProductDto {
  limit?: number;
  name?: string;
  category?: Category;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  maxGroupSize?: number;
  b2bOnly?: boolean;
}

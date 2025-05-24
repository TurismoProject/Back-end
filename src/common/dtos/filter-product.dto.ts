import { Category } from '@prisma/client';

export class ProductFiltersDto {
  categories: Category[];
  maxPrice: number;
  minPrice: number;
  maxGroupSize: number;
  minRating: number;
}

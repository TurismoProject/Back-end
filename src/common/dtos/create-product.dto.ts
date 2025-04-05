import { IsCategoryArray } from '@common/decorators/is-category-array.decorator';
import { Category } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsDecimal,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsArray()
  @IsCategoryArray()
  @ArrayNotEmpty()
  categories: Category[];
}

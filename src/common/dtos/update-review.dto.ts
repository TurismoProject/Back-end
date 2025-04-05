import { AnyOf } from '@common/decorators/any-of.decorator';
import {
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@AnyOf(['productId', 'supplierId'])
export class UpdateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsDecimal()
  rating: number;

  @IsUUID()
  productId: string;

  @IsUUID()
  supplierId: string;
}

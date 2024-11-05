import { AnyOf } from '@common/decorators/any-of.decorator';
import { IsDecimal, IsNotEmpty, IsString, IsUUID } from 'class-validator';

@AnyOf(['productId', 'supplierId'])
export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDecimal()
  rating: number;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsUUID()
  productId: string;

  @IsUUID()
  supplierId: string;
}

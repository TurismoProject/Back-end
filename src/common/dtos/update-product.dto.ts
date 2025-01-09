import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['supplierId']),
) {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

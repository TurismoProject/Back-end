import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['supplierId']),
) {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsArray()
  imagesUrl?: Array<string>;
}

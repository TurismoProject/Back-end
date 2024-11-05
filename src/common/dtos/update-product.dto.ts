import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsArray()
  @IsNotEmpty()
  imagesUrl: Array<string>;
}
